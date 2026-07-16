'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  Code2,
  FileText,
  BarChart3,
  Award,
  Bell,
  Settings,
  ScrollText,
  Building2,
  UserCheck,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const adminNav: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Departments', href: '/admin/departments', icon: Building2 },
      { label: 'Batches', href: '/admin/batches', icon: UserCheck },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Courses', href: '/admin/courses', icon: BookOpen },
      { label: 'MCQ Tests', href: '/admin/tests', icon: ClipboardList },
      { label: 'Coding Tests', href: '/admin/coding', icon: Code2 },
      { label: 'Assignments', href: '/admin/assignments', icon: FileText },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Reports', href: '/admin/reports', icon: ScrollText },
      { label: 'Certificates', href: '/admin/certificates', icon: Award },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Activity Logs', href: '/admin/activity-logs', icon: ScrollText },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34,
            height: 34,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>Training</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6875rem', fontWeight: 500 }}>Compiler</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '8px 0', flex: 1 }}>
        {adminNav.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} className="nav-icon" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
