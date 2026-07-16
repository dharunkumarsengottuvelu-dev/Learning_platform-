import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ScrollText, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Activity Logs — Admin' };

export default async function ActivityLogsPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('id, action, entity_type, entity_id, created_at, users!user_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">Activity Logs</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            System-wide audit trail
          </p>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
        <input type="text" placeholder="Search logs…" className="form-input" style={{ paddingLeft: '32px', height: '36px' }} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {!logs || logs.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <ScrollText size={40} className="empty-state-icon" />
                      <p style={{ fontWeight: 500 }}>No activity logged yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                      {formatDate(log.created_at)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{(log.users as any)?.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{(log.users as any)?.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{log.action}</span>
                    </td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>
                      {log.entity_type ? `${log.entity_type} (${log.entity_id})` : '—'}
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
