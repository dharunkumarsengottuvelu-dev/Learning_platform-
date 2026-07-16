'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createUserSchema, type CreateUserFormValues } from '@/validators';
import type { ActionResult, UserProfile } from '@/types';

// ─── User Management (admin only) ─────────────────────────────────────────────

export async function createUserAction(
  data: CreateUserFormValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const admin = createAdminClient();

  // Create auth user
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  });

  if (authError || !authUser.user) {
    return { success: false, error: authError?.message ?? 'Failed to create user' };
  }

  // Update the profile row created by trigger
  const { error } = await admin
    .from('users')
    .update({
      role: parsed.data.role,
      department_id: parsed.data.department_id ?? null,
      designation: parsed.data.designation ?? null,
      phone: parsed.data.phone ?? null,
    })
    .eq('id', authUser.user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/users');
  return { success: true, data: { id: authUser.user.id } };
}

export async function updateUserRoleAction(
  userId: string,
  role: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/users');
  return { success: true, data: undefined };
}

export async function toggleUserStatusAction(
  userId: string,
  isActive: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/users');
  return { success: true, data: undefined };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/users');
  return { success: true, data: undefined };
}

export async function resetUserPasswordAction(userId: string): Promise<ActionResult<{ link: string }>> {
  const admin = createAdminClient();
  const { data: user } = await admin.from('users').select('email').eq('id', userId).single();
  if (!user?.email) return { success: false, error: 'User not found' };

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: user.email,
  });

  if (error || !data) return { success: false, error: error?.message ?? 'Failed to generate link' };
  return { success: true, data: { link: data.properties?.action_link ?? '' } };
}

// ─── Profile Update ───────────────────────────────────────────────────────────

export async function updateProfileAction(
  data: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'designation' | 'avatar_url'>>
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('users')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/profile');
  return { success: true, data: undefined };
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export async function logActivityAction(input: {
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: input.action,
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
      metadata: input.metadata ?? null,
    });
  } catch {
    // Activity logging failure must never break the main flow
  }
}
