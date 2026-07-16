import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { FileText, Download } from 'lucide-react';

export const metadata: Metadata = { title: 'Reports — Admin' };

export default async function ReportsPage() {
  const supabase = await createClient();

  // Basic report data structure
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">Reports & Exports</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            Download system reports and analytics data
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {[
          { title: 'User Performance Report', desc: 'Comprehensive scores across all tests and coding challenges' },
          { title: 'Course Completion Status', desc: 'Progress tracking for all assigned courses' },
          { title: 'System Activity Logs', desc: 'Audit trail of administrative actions' }
        ].map((report) => (
          <div key={report.title} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: 'var(--color-primary-10)', borderRadius: '8px' }}>
                <FileText style={{ color: 'var(--color-primary)' }} size={24} />
              </div>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{report.title}</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>{report.desc}</p>
              </div>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <Download size={16} /> Generate CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
