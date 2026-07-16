import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { LayoutDashboard, Users, FileCheck, CalendarDays, Settings } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LogoutButton } from '@/components/ui/LogoutButton';
import { getInitials } from '@/lib/utils';

export default async function TrainerLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
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

  if (profile.role !== 'trainer') {
    redirect('/403');
  }

  const navItems = [
    { label: 'Dashboard', href: '/trainer/dashboard', icon: LayoutDashboard },
    { label: 'My Batches', href: '/trainer/batches', icon: Users },
    { label: 'Submissions inbox', href: '/trainer/submissions', icon: FileCheck },
    { label: 'Schedule', href: '/trainer/schedule', icon: CalendarDays },
    { label: 'Settings', href: '/trainer/settings', icon: Settings },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar">
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '8px',
            background: 'var(--color-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'white'
          }}>
            <Users size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>LMS</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>Trainer Portal</span>
          </div>
        </div>

        <nav style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="nav-item">
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '24px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--color-surface)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-foreground)'
          }}>
            {getInitials(profile.full_name)}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {profile.full_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {profile.email}
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
