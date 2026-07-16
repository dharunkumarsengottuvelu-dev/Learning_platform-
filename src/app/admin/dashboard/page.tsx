import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import {
  Users,
  BookOpen,
  ClipboardList,
  Award,
  TrendingUp,
  Code2,
} from 'lucide-react';

export const metadata: Metadata = { title: 'Admin Dashboard' };

async function getDashboardStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [users, courses, tests, certificates, codingSubmissions] = await Promise.all([
    supabase.from('users').select('id, role, created_at', { count: 'exact' }),
    supabase.from('courses').select('id, status', { count: 'exact' }),
    supabase.from('tests').select('id', { count: 'exact' }),
    supabase.from('certificates').select('id', { count: 'exact' }),
    supabase.from('coding_submissions').select('id, status', { count: 'exact' }),
  ]);

  const activeStudents = users.data?.filter((u) => u.role === 'student').length ?? 0;
  const publishedCourses = courses.data?.filter((c) => c.status === 'published').length ?? 0;
  const acceptedSubmissions = codingSubmissions.data?.filter((s) => s.status === 'accepted').length ?? 0;

  return {
    totalUsers: users.count ?? 0,
    activeStudents,
    publishedCourses,
    totalCourses: courses.count ?? 0,
    totalTests: tests.count ?? 0,
    totalCertificates: certificates.count ?? 0,
    totalSubmissions: codingSubmissions.count ?? 0,
    acceptedSubmissions,
  };
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const stats = await getDashboardStats(supabase);

  // Recent users
  const { data: recentUsers } = await supabase
    .from('users')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      sub: `${stats.activeStudents} students`,
      icon: Users,
      color: '#0A1F44',
    },
    {
      label: 'Courses',
      value: stats.totalCourses,
      sub: `${stats.publishedCourses} published`,
      icon: BookOpen,
      color: '#0891B2',
    },
    {
      label: 'Tests Created',
      value: stats.totalTests,
      sub: 'MCQ + Coding',
      icon: ClipboardList,
      color: '#7C3AED',
    },
    {
      label: 'Certificates Issued',
      value: stats.totalCertificates,
      sub: 'All time',
      icon: Award,
      color: '#059669',
    },
    {
      label: 'Code Submissions',
      value: stats.totalSubmissions,
      sub: `${stats.acceptedSubmissions} accepted`,
      icon: Code2,
      color: '#D97706',
    },
    {
      label: 'Pass Rate',
      value: stats.totalSubmissions > 0
        ? `${Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100)}%`
        : '—',
      sub: 'Coding assessments',
      icon: TrendingUp,
      color: '#DC2626',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 className="text-h2">Dashboard Overview</h2>
        <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
          System-wide metrics and recent activity
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="stat-card-label">{card.label}</span>
                <div style={{
                  width: 32, height: 32,
                  borderRadius: '8px',
                  background: `${card.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} style={{ color: card.color }} />
                </div>
              </div>
              <div className="stat-card-value">{card.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '4px' }}>{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Users */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' }}>Recent Registrations</h3>
          <a href="/admin/users" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
            View all →
          </a>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers && recentUsers.length > 0 ? (
                recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                    <td style={{ color: 'var(--color-muted)' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${
                        u.role === 'super_admin' || u.role === 'admin' ? 'badge-danger' :
                        u.role === 'trainer' ? 'badge-info' :
                        u.role === 'manager' ? 'badge-warning' : 'badge-neutral'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state" style={{ padding: '32px' }}>
                      <p>No users yet. Add users to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
