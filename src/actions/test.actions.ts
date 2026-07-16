'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  testSchema,
  questionSchema,
  questionOptionSchema,
  type TestFormValues,
  type QuestionFormValues,
  type QuestionOptionFormValues,
} from '@/validators';
import type { ActionResult } from '@/types';

// ─── Tests ────────────────────────────────────────────────────────────────────

export async function createTestAction(
  data: TestFormValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = testSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: test, error } = await supabase
    .from('tests')
    .insert({ ...parsed.data, created_by: user.id })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/tests');
  return { success: true, data: { id: test.id } };
}

export async function updateTestAction(
  id: string,
  data: Partial<TestFormValues>
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tests')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/tests');
  return { success: true, data: undefined };
}

export async function deleteTestAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('tests').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/tests');
  return { success: true, data: undefined };
}

// ─── Questions ────────────────────────────────────────────────────────────────

export async function createQuestionAction(
  data: QuestionFormValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = questionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: q, error } = await supabase
    .from('questions')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/admin/tests/${data.test_id}`);
  return { success: true, data: { id: q.id } };
}

export async function updateQuestionAction(
  id: string,
  data: Partial<QuestionFormValues>
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('questions').update(data).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/tests');
  return { success: true, data: undefined };
}

export async function deleteQuestionAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/tests');
  return { success: true, data: undefined };
}

// ─── Question Options ─────────────────────────────────────────────────────────

export async function createOptionAction(
  data: QuestionOptionFormValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = questionOptionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: opt, error } = await supabase
    .from('question_options')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: opt.id } };
}

export async function bulkUpsertOptionsAction(
  questionId: string,
  options: Array<{ option_text: string; is_correct: boolean; order_index: number }>
): Promise<ActionResult> {
  const supabase = await createClient();

  // Delete existing options first
  await supabase.from('question_options').delete().eq('question_id', questionId);

  const rows = options.map((o) => ({ ...o, question_id: questionId }));
  const { error } = await supabase.from('question_options').insert(rows);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// ─── Test Attempts ────────────────────────────────────────────────────────────

export async function startTestAttemptAction(
  testId: string
): Promise<ActionResult<{ attemptId: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Check existing attempts
  const { data: existing } = await supabase
    .from('test_attempts')
    .select('id, attempt_number')
    .eq('test_id', testId)
    .eq('student_id', user.id)
    .order('attempt_number', { ascending: false })
    .limit(1);

  const { data: test } = await supabase
    .from('tests')
    .select('max_attempts')
    .eq('id', testId)
    .single();

  const attemptCount = existing?.length ?? 0;
  if (test && attemptCount >= test.max_attempts) {
    return { success: false, error: 'Maximum attempts reached for this test' };
  }

  const { data: attempt, error } = await supabase
    .from('test_attempts')
    .insert({
      test_id: testId,
      student_id: user.id,
      status: 'in_progress',
      attempt_number: attemptCount + 1,
      answers: {},
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { attemptId: attempt.id } };
}

export async function saveAnswerAction(input: {
  attemptId: string;
  questionId: string;
  answerId: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: attempt } = await supabase
    .from('test_attempts')
    .select('answers, student_id')
    .eq('id', input.attemptId)
    .single();

  if (!attempt || attempt.student_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const updatedAnswers = {
    ...(attempt.answers as Record<string, string>),
    [input.questionId]: input.answerId,
  };

  const { error } = await supabase
    .from('test_attempts')
    .update({ answers: updatedAnswers })
    .eq('id', input.attemptId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function submitTestAttemptAction(
  attemptId: string,
  isAutoSubmit = false
): Promise<ActionResult<{ score: number; percentage: number; passed: boolean }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: attempt } = await supabase
    .from('test_attempts')
    .select('answers, test_id, student_id')
    .eq('id', attemptId)
    .single();

  if (!attempt || attempt.student_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: test } = await supabase
    .from('tests')
    .select('total_marks, pass_percentage, negative_marking, negative_marks_per_wrong')
    .eq('id', attempt.test_id)
    .single();

  const { data: questions } = await supabase
    .from('questions')
    .select('id, marks, question_options(id, is_correct)')
    .eq('test_id', attempt.test_id);

  // Grade the attempt
  let score = 0;
  const answers = attempt.answers as Record<string, string>;

  for (const q of questions ?? []) {
    const selectedOptionId = answers[q.id];
    if (!selectedOptionId) continue;

    const opts = (q.question_options as Array<{ id: string; is_correct: boolean }>);
    const selectedOption = opts.find((o) => o.id === selectedOptionId);

    if (selectedOption?.is_correct) {
      score += Number(q.marks);
    } else if (test?.negative_marking && selectedOption) {
      score -= Number(test.negative_marks_per_wrong);
    }
  }

  score = Math.max(0, score);
  const totalMarks = Number(test?.total_marks ?? 100);
  const percentage = Math.round((score / totalMarks) * 100 * 100) / 100;
  const passed = percentage >= Number(test?.pass_percentage ?? 60);

  const { error } = await supabase
    .from('test_attempts')
    .update({
      status: isAutoSubmit ? 'auto_submitted' : 'submitted',
      submitted_at: new Date().toISOString(),
      score,
      percentage,
      passed,
    })
    .eq('id', attemptId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/student/tests');
  return { success: true, data: { score, percentage, passed } };
}
