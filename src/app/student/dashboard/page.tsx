import { createClient } from '@/lib/supabase/server';
import { BookOpen, CheckCircle, Clock, Trophy } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Student Dashboard' };

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch some summary stats
  // In a real app, these would be aggregated from course_enrollments and submissions
  const stats = [
    { label: 'Enrolled Courses', value: '3', icon: BookOpen, color: 'var(--color-info)' },
    { label: 'Completed Tests', value: '5', icon: CheckCircle, color: 'var(--color-success)' },
    { label: 'Pending Assignments', value: '2', icon: Clock, color: 'var(--color-warning)' },
    { label: 'Certificates Earned', value: '1', icon: Trophy, color: 'var(--color-primary)' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h2 className="text-h2">Welcome back!</h2>
        <p style={{ color: 'var(--color-muted)', marginTop: '4px' }}>Here's an overview of your learning progress.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '12px',
              background: `color-mix(in srgb, ${s.color} 15%, transparent)`,
              color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <s.icon size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)', fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px' }}>Recent Courses</h3>
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <BookOpen size={32} className="empty-state-icon" />
            <p>You haven't started any courses yet.</p>
            <Link href="/student/courses" className="btn btn-primary" style={{ marginTop: '16px' }}>
              Browse Courses
            </Link>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px' }}>Upcoming Deadlines</h3>
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <Clock size={32} className="empty-state-icon" />
            <p>No upcoming assignments or tests.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
