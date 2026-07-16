'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types';

// ─── Notifications ────────────────────────────────────────────────────────────

export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/notifications');
  return { success: true, data: undefined };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return { success: false, error: error.message };
  revalidatePath('/notifications');
  return { success: true, data: undefined };
}

export async function deleteNotificationAction(
  notificationId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/notifications');
  return { success: true, data: undefined };
}

export async function sendAnnouncementAction(input: {
  title: string;
  message: string;
  target_role?: string;
  link?: string;
}): Promise<ActionResult<{ count: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  let query = supabase.from('users').select('id');
  if (input.target_role) {
    query = query.eq('role', input.target_role) as typeof query;
  }

  const { data: users, error: usersError } = await query;
  if (usersError) return { success: false, error: usersError.message };

  const notifications = (users ?? []).map((u) => ({
    user_id: u.id,
    type: 'announcement' as const,
    title: input.title,
    message: input.message,
    link: input.link ?? null,
  }));

  if (notifications.length === 0) return { success: true, data: { count: 0 } };

  // Batch insert in chunks of 500
  const chunkSize = 500;
  for (let i = 0; i < notifications.length; i += chunkSize) {
    const { error } = await supabase
      .from('notifications')
      .insert(notifications.slice(i, i + chunkSize));
    if (error) return { success: false, error: error.message };
  }

  revalidatePath('/admin/notifications');
  return { success: true, data: { count: notifications.length } };
}
