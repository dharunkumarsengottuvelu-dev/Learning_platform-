'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { assignmentSchema, type AssignmentFormValues } from '@/validators';
import type { ActionResult } from '@/types';

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function createAssignmentAction(
  data: AssignmentFormValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = assignmentSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: assignment, error } = await supabase
    .from('assignments')
    .insert({ ...parsed.data, created_by: user.id })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/assignments');
  return { success: true, data: { id: assignment.id } };
}

export async function updateAssignmentAction(
  id: string,
  data: Partial<AssignmentFormValues>
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('assignments').update(data).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/assignments');
  return { success: true, data: undefined };
}

export async function deleteAssignmentAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('assignments').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/assignments');
  return { success: true, data: undefined };
}

// ─── Student Submission ───────────────────────────────────────────────────────

export async function submitAssignmentAction(input: {
  assignment_id: string;
  file_urls: string[];
  notes?: string;
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: sub, error } = await supabase
    .from('assignment_submissions')
    .upsert({
      assignment_id: input.assignment_id,
      student_id: user.id,
      file_urls: input.file_urls,
      notes: input.notes ?? null,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,student_id' })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/student/assignments');
  return { success: true, data: { id: sub.id } };
}

// ─── Trainer Review ───────────────────────────────────────────────────────────

export async function reviewAssignmentSubmissionAction(input: {
  submissionId: string;
  status: 'approved' | 'rejected' | 'resubmit_requested';
  grade?: number;
  feedback?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('assignment_submissions')
    .update({
      status: input.status,
      grade: input.grade ?? null,
      feedback: input.feedback ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', input.submissionId);

  if (error) return { success: false, error: error.message };

  // Notify the student
  const { data: sub } = await supabase
    .from('assignment_submissions')
    .select('student_id')
    .eq('id', input.submissionId)
    .single();

  if (sub?.student_id) {
    await supabase.from('notifications').insert({
      user_id: sub.student_id,
      type: 'submission_reviewed',
      title: 'Assignment Reviewed',
      message: `Your assignment submission has been ${input.status.replace('_', ' ')}.`,
      link: '/student/assignments',
    });
  }

  revalidatePath('/admin/assignments');
  revalidatePath('/trainer/assignments');
  return { success: true, data: undefined };
}
