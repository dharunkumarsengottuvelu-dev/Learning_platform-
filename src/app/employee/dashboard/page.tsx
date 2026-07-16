import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Manager Dashboard' };

export default async function ManagerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  if (!['manager', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/403');
  }

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
        Manager Portal
      </h1>
      <p style={{ color: 'var(--color-muted)' }}>
        Welcome, {profile?.full_name}. Monitor team progress and reports here.
      </p>
    </div>
  );
}
