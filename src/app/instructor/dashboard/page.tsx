import { Users, FileCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Trainer Dashboard' };

export default async function TrainerDashboardPage() {
  
  const stats = [
    { label: 'Active Batches', value: '4', icon: Users, color: 'var(--color-info)' },
    { label: 'Pending Submissions', value: '18', icon: FileCheck, color: 'var(--color-warning)' },
    { label: 'Students At Risk', value: '3', icon: AlertCircle, color: 'var(--color-danger)' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h2 className="text-h2">Trainer Dashboard</h2>
        <p style={{ color: 'var(--color-muted)', marginTop: '4px' }}>Overview of your classes and tasks.</p>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Needs Review</h3>
            <Link href="/trainer/submissions" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <FileCheck size={32} className="empty-state-icon" />
            <p>All caught up! No pending submissions.</p>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px' }}>Upcoming Sessions</h3>
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <Users size={32} className="empty-state-icon" />
            <p>No upcoming live sessions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
