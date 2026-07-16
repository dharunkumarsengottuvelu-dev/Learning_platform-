'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getInitials, formatRole } from '@/lib/utils';
import type { UserProfile } from '@/types';

interface AdminTopbarProps {
  title: string;
  user: UserProfile | null;
}

export function AdminTopbar({ title, user }: AdminTopbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <header className="dashboard-topbar">
      {/* Page title */}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>{title}</h1>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', width: '260px' }}>
        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
        <input
          type="text"
          placeholder="Search…"
          className="form-input"
          style={{ paddingLeft: '32px', height: '36px', fontSize: '0.8125rem' }}
        />
      </div>

      {/* Notifications */}
      <button
        className="btn btn-ghost btn-icon"
        style={{ position: 'relative' }}
        onClick={() => router.push('/admin/notifications')}
      >
        <Bell size={18} />
        {/* Unread badge */}
        <span style={{
          position: 'absolute', top: '6px', right: '6px',
          width: '8px', height: '8px',
          background: 'var(--color-danger)',
          borderRadius: '50%',
          border: '2px solid white',
        }} />
      </button>

      {/* User dropdown */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Avatar */}
          <div style={{
            width: 32, height: 32,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
          }}>
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt={user.full_name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              getInitials(user?.full_name ?? 'U')
            )}
          </div>
          <div style={{ textAlign: 'left', display: 'none' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.2 }}>
              {user?.full_name ?? 'User'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-muted)' }}>
              {user?.role ? formatRole(user.role) : ''}
            </div>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--color-muted)' }} />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: '200px',
            background: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            zIndex: 50,
          }}>
            {/* User info */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>{user?.full_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>{user?.email}</div>
              <div style={{ marginTop: '4px' }}>
                <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                  {user?.role ? formatRole(user.role) : ''}
                </span>
              </div>
            </div>

            {[
              { label: 'Profile', icon: User, href: '/profile' },
              { label: 'Settings', icon: Settings, href: '/admin/settings' },
            ].map(({ label, icon: Icon, href }) => (
              <button
                key={label}
                onClick={() => { setDropdownOpen(false); router.push(href); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 16px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: '0.875rem', color: 'var(--color-text)',
                  transition: 'background 100ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <Icon size={15} style={{ color: 'var(--color-muted)' }} />
                {label}
              </button>
            ))}

            <div style={{ borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 16px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: '0.875rem', color: 'var(--color-danger)',
                  transition: 'background 100ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
