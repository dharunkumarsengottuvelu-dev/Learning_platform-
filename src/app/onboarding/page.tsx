import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { OnboardingPoller } from './OnboardingPoller';
import { ROLE_DEFAULT_REDIRECT } from '@/lib/constants';
import type { UserRole } from '@/types';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  // Use the admin client to bypass any RLS rules. We know who the user is from the auth token.
  // This guarantees we only fail to fetch if the row truly doesn't exist yet.
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile) {
    const role = (profile.role as UserRole) ?? 'student';
    const dashboard = ROLE_DEFAULT_REDIRECT[role] ?? '/student/dashboard';
    redirect(dashboard);
  }

  // If we reach here, the profile row hasn't been created yet by the DB trigger.
  // Render the loading UI and mount the poller.
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-background)',
      padding: '24px'
    }}>
      <div className="card animate-fade-in" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 24px auto'
        }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Setting up your workspace</h2>
        <p style={{ color: 'var(--color-muted)' }}>
          Please hold on for just a moment while we configure your account...
        </p>
        <OnboardingPoller />
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
