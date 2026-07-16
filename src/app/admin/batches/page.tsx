import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { UserCheck, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Batches — Admin' };

export default async function BatchesPage() {
  const supabase = await createClient();

  const { data: batches } = await supabase
    .from('batches')
    .select('id, name, start_date, end_date, departments(name)')
    .order('start_date', { ascending: false });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">Batches</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            Manage training batches and cohorts
          </p>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
        <input type="text" placeholder="Search batches…" className="form-input" style={{ paddingLeft: '32px', height: '36px' }} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Department</th>
                <th>Timeline</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!batches || batches.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <UserCheck size={40} className="empty-state-icon" />
                      <p style={{ fontWeight: 500 }}>No batches found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td style={{ color: 'var(--color-muted)' }}>{(b.departments as any)?.name ?? '—'}</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>
                      {b.start_date ? formatDate(b.start_date) : 'TBD'} - {b.end_date ? formatDate(b.end_date) : 'TBD'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm">Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
