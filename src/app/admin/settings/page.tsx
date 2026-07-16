import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Settings } from 'lucide-react';

export const metadata: Metadata = { title: 'Settings — Admin' };

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .order('key');

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">System Settings</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            Configure global platform behavior
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {settings?.map((s) => (
            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{s.key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '2px' }}><code>{s.key}</code></div>
              </div>
              <div style={{ fontWeight: 600 }}>{s.value}</div>
            </div>
          ))}
          {!settings || settings.length === 0 && (
            <div className="empty-state">
              <Settings size={32} className="empty-state-icon" />
              <p>No settings configured</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
