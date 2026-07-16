'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { codingQuestionSchema, type CodingQuestionFormValues } from '@/validators';
import type { ActionResult } from '@/types';

// ─── Coding Questions ─────────────────────────────────────────────────────────

export async function createCodingQuestionAction(
  data: CodingQuestionFormValues & { starter_code?: Record<string, string> }
): Promise<ActionResult<{ id: string }>> {
  const parsed = codingQuestionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: q, error } = await supabase
    .from('coding_questions')
    .insert({
      ...parsed.data,
      starter_code: data.starter_code ?? {},
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/coding');
  return { success: true, data: { id: q.id } };
}

export async function updateCodingQuestionAction(
  id: string,
  data: Partial<CodingQuestionFormValues> & { starter_code?: Record<string, string> }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('coding_questions')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/coding');
  return { success: true, data: undefined };
}

export async function deleteCodingQuestionAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('coding_questions').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/coding');
  return { success: true, data: undefined };
}

// ─── Test Cases ───────────────────────────────────────────────────────────────

export async function upsertTestCasesAction(
  questionId: string,
  cases: Array<{ input: string; expected_output: string; is_sample: boolean; order_index: number }>
): Promise<ActionResult> {
  const supabase = await createClient();
  await supabase.from('coding_test_cases').delete().eq('question_id', questionId);
  const rows = cases.map((c) => ({ ...c, question_id: questionId }));
  const { error } = await supabase.from('coding_test_cases').insert(rows);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/admin/coding/${questionId}`);
  return { success: true, data: undefined };
}

// ─── Admin Review ─────────────────────────────────────────────────────────────

export async function reviewCodingSubmissionAction(input: {
  submissionId: string;
  score: number;
  feedback?: string;
  overrideStatus?: 'accepted' | 'wrong_answer';
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('coding_submissions')
    .update({
      score: input.score,
      ...(input.overrideStatus ? { status: input.overrideStatus } : {}),
    })
    .eq('id', input.submissionId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/coding');
  return { success: true, data: undefined };
}
