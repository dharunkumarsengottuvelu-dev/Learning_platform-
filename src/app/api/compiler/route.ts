export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { codingSubmissionSchema } from '@/validators';
import { JUDGE0_LANGUAGE_IDS } from '@/lib/constants';

/**
 * POST /api/compiler
 * Validates user session → forwards code to external Judge0 → stores submission
 * Returns the Judge0 token for client-side polling.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = codingSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { question_id, language, source_code, test_attempt_id } = parsed.data;

  const judge0Url = process.env.JUDGE0_API_URL;
  const judge0Key = process.env.JUDGE0_API_KEY;

  if (!judge0Url) {
    return NextResponse.json(
      { error: 'Compiler service not configured. Add JUDGE0_API_URL to environment variables.' },
      { status: 503 }
    );
  }

  // Fetch test cases to run
  const { data: testCases } = await supabase
    .from('coding_test_cases')
    .select('input, expected_output, is_sample, order_index')
    .eq('question_id', question_id)
    .order('order_index');

  // Fetch question limits
  const { data: question } = await supabase
    .from('coding_questions')
    .select('time_limit_ms, memory_limit_mb')
    .eq('id', question_id)
    .single();

  const languageId = JUDGE0_LANGUAGE_IDS[language];

  // Submit to Judge0 — one submission per test case (batch)
  const submissions = (testCases ?? []).map((tc) => ({
    language_id: languageId,
    source_code: Buffer.from(source_code).toString('base64'),
    stdin: Buffer.from(tc.input).toString('base64'),
    expected_output: Buffer.from(tc.expected_output).toString('base64'),
    cpu_time_limit: (question?.time_limit_ms ?? 2000) / 1000,
    memory_limit: (question?.memory_limit_mb ?? 256) * 1000,
  }));

  let judge0Token: string | null = null;
  let judge0Status = 'pending';

  try {
    if (submissions.length > 0) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (judge0Key) {
        headers['X-RapidAPI-Key'] = judge0Key;
        headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
      }

      const j0Res = await fetch(`${judge0Url}/submissions/batch?base64_encoded=true&wait=false`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ submissions }),
      });

      if (j0Res.ok) {
        const j0Data = await j0Res.json() as Array<{ token: string }>;
        judge0Token = j0Data.map((t) => t.token).join(',');
        judge0Status = 'running';
      }
    }
  } catch {
    judge0Status = 'pending';
  }

  // Store submission in DB
  const { data: submission, error } = await supabase
    .from('coding_submissions')
    .insert({
      question_id,
      student_id: user.id,
      test_attempt_id: test_attempt_id ?? null,
      language,
      source_code,
      status: judge0Status as 'pending' | 'running',
      judge0_token: judge0Token,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    submissionId: submission.id,
    judge0Token,
    status: judge0Status,
  });
}

/**
 * GET /api/compiler?submissionId=xxx
 * Polls Judge0 for submission status and updates DB.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get('submissionId');

  if (!submissionId) {
    return NextResponse.json({ error: 'submissionId required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: submission } = await supabase
    .from('coding_submissions')
    .select('id, judge0_token, status, student_id')
    .eq('id', submissionId)
    .single();

  if (!submission || submission.student_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // If already finalized, return cached result
  if (['accepted', 'wrong_answer', 'time_limit', 'runtime_error', 'compile_error'].includes(submission.status)) {
    return NextResponse.json({ status: submission.status });
  }

  const judge0Url = process.env.JUDGE0_API_URL;
  const judge0Key = process.env.JUDGE0_API_KEY;

  if (!judge0Url || !submission.judge0_token) {
    return NextResponse.json({ status: submission.status });
  }

  try {
    const headers: Record<string, string> = {};
    if (judge0Key) {
      headers['X-RapidAPI-Key'] = judge0Key;
      headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
    }

    const tokens = submission.judge0_token;
    const pollRes = await fetch(
      `${judge0Url}/submissions/batch?tokens=${tokens}&base64_encoded=true&fields=status,time,memory`,
      { headers }
    );

    if (pollRes.ok) {
      const pollData = await pollRes.json() as { submissions: Array<{ status: { id: number; description: string }; time?: string; memory?: number }> };
      const results = pollData.submissions;

      // Map Judge0 status IDs to our status
      const allDone = results.every((r) => r.status.id > 2);
      if (allDone) {
        const allAccepted = results.every((r) => r.status.id === 3);
        const finalStatus = allAccepted ? 'accepted' : 
          results.some((r) => r.status.id === 5) ? 'time_limit' :
          results.some((r) => r.status.id === 6) ? 'compile_error' :
          results.some((r) => r.status.id >= 7) ? 'runtime_error' : 'wrong_answer';

        const avgTime = results.reduce((s, r) => s + parseFloat(r.time ?? '0'), 0) / results.length * 1000;
        const maxMemory = Math.max(...results.map((r) => (r.memory ?? 0) / 1000));

        await supabase
          .from('coding_submissions')
          .update({
            status: finalStatus,
            execution_time_ms: Math.round(avgTime),
            memory_used_mb: Math.round(maxMemory * 100) / 100,
            score: allAccepted ? 100 : 0,
            test_case_results: results.map((r) => ({
              passed: r.status.id === 3,
              time_ms: Math.round(parseFloat(r.time ?? '0') * 1000),
              memory_mb: Math.round((r.memory ?? 0) / 1000),
            })),
          })
          .eq('id', submissionId);

        return NextResponse.json({ status: finalStatus });
      }
    }
  } catch {
    // Judge0 poll failed — return current DB status
  }

  return NextResponse.json({ status: submission.status });
}
