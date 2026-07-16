'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  courseSchema,
  moduleSchema,
  chapterSchema,
  topicSchema,
  type CourseFormValues,
  type ModuleFormValues,
  type ChapterFormValues,
  type TopicFormValues,
} from '@/validators';
import type { ActionResult } from '@/types';

// ─── Courses ──────────────────────────────────────────────────────────────────

export async function createCourseAction(
  data: CourseFormValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = courseSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: course, error } = await supabase
    .from('courses')
    .insert({ ...parsed.data, created_by: user.id })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/courses');
  return { success: true, data: { id: course.id } };
}

export async function updateCourseAction(
  id: string,
  data: Partial<CourseFormValues>
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('courses')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${id}`);
  return { success: true, data: undefined };
}

export async function deleteCourseAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/courses');
  return { success: true, data: undefined };
}

// ─── Modules ──────────────────────────────────────────────────────────────────

export async function createModuleAction(
  data: ModuleFormValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = moduleSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: mod, error } = await supabase
    .from('modules')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/admin/courses/${data.course_id}`);
  return { success: true, data: { id: mod.id } };
}

export async function updateModuleAction(
  id: string,
  data: Partial<ModuleFormValues>
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('modules').update(data).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/courses');
  return { success: true, data: undefined };
}

export async function deleteModuleAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('modules').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/courses');
  return { success: true, data: undefined };
}

// ─── Chapters ─────────────────────────────────────────────────────────────────

export async function createChapterAction(
  data: ChapterFormValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = chapterSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: ch, error } = await supabase
    .from('chapters')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/courses');
  return { success: true, data: { id: ch.id } };
}

export async function deleteChapterAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('chapters').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/courses');
  return { success: true, data: undefined };
}

// ─── Topics ───────────────────────────────────────────────────────────────────

export async function createTopicAction(
  data: TopicFormValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = topicSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: topic, error } = await supabase
    .from('topics')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/courses');
  return { success: true, data: { id: topic.id } };
}

export async function deleteTopicAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/courses');
  return { success: true, data: undefined };
}

// ─── Topic Progress ───────────────────────────────────────────────────────────

export async function markTopicCompleteAction(
  topicId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('topic_progress')
    .upsert({
      user_id: user.id,
      topic_id: topicId,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,topic_id' });

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// ─── Course Assignment ─────────────────────────────────────────────────────────

export async function assignCourseAction(input: {
  course_id: string;
  assignee_type: 'individual' | 'batch' | 'department';
  assignee_ids: string[];
  start_date?: string;
  end_date?: string;
  deadline?: string;
  is_mandatory?: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const rows = input.assignee_ids.map((id) => ({
    course_id: input.course_id,
    assignee_type: input.assignee_type,
    assignee_id: id,
    assigned_by: user.id,
    start_date: input.start_date ?? null,
    end_date: input.end_date ?? null,
    deadline: input.deadline ?? null,
    is_mandatory: input.is_mandatory ?? true,
  }));

  const { error } = await supabase.from('course_assignments').insert(rows);
  if (error) return { success: false, error: error.message };

  // Send notifications to each student
  if (input.assignee_type === 'individual') {
    const notifs = input.assignee_ids.map((uid) => ({
      user_id: uid,
      type: 'course_assigned' as const,
      title: 'New Course Assigned',
      message: 'A new course has been assigned to you.',
    }));
    await supabase.from('notifications').insert(notifs);
  }

  revalidatePath('/admin/courses');
  return { success: true, data: undefined };
}

// ─── Storage — Signed Upload URL ──────────────────────────────────────────────

export async function getSignedUploadUrlAction(input: {
  bucket: string;
  path: string;
}): Promise<ActionResult<{ signedUrl: string; token: string }>> {
  // Uses admin client to bypass RLS for storage operations
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(input.bucket)
    .createSignedUploadUrl(input.path);

  if (error || !data) return { success: false, error: error?.message ?? 'Failed to generate URL' };
  return { success: true, data: { signedUrl: data.signedUrl, token: data.token } };
}

export async function getSignedDownloadUrlAction(input: {
  bucket: string;
  path: string;
  expiresIn?: number;
}): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(input.bucket)
    .createSignedUrl(input.path, input.expiresIn ?? 3600);

  if (error || !data) return { success: false, error: error?.message ?? 'Failed to generate URL' };
  return { success: true, data: { url: data.signedUrl } };
}
