import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import type { UserProfile } from '@/types';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Use admin client to reliably check profile without RLS interfering
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('users')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  if (!['admin', 'super_admin'].includes(profile.role)) {
    redirect('/403');
  }

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="dashboard-main">
        <AdminTopbar
          title="Admin Portal"
          user={profile as UserProfile}
        />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
