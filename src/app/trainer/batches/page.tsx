import { Users, Search } from 'lucide-react';

export const metadata = { title: 'My Batches — Trainer' };

export default async function TrainerBatchesPage() {
  
  // Dummy data representing batches assigned to this trainer
  const batches = [
    { id: '1', name: 'React Q3 Cohort', students: 24, progress: 65 },
    { id: '2', name: 'Python Basics Bootcamp', students: 40, progress: 20 },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">My Batches</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            Monitor the progress of your assigned cohorts.
          </p>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
        <input type="text" placeholder="Search batches…" className="form-input" style={{ paddingLeft: '32px', height: '36px' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {batches.length === 0 ? (
          <div className="card empty-state" style={{ padding: '60px 20px', gridColumn: '1 / -1' }}>
            <Users size={48} className="empty-state-icon" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '16px 0 8px' }}>No batches assigned</h3>
            <p style={{ color: 'var(--color-muted)' }}>You have not been assigned to any active batches.</p>
          </div>
        ) : (
          batches.map((batch) => (
            <div key={batch.id} className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>{batch.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
                <Users size={16} /> {batch.students} Students
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '8px', fontWeight: 600 }}>
                  <span>Avg. Progress</span>
                  <span>{batch.progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--color-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${batch.progress}%`, height: '100%', background: 'var(--color-primary)' }} />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>View Students</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Analytics</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
