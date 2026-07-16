import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Award, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Certificates — Admin' };

export default async function CertificatesPage() {
  const supabase = await createClient();

  const { data: certificates } = await supabase
    .from('certificates')
    .select('id, certificate_url, issued_at, users!student_id(full_name, email), courses!course_id(title)')
    .order('issued_at', { ascending: false })
    .limit(50);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">Certificates</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            Issued certificates across the platform
          </p>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
        <input type="text" placeholder="Search certificates…" className="form-input" style={{ paddingLeft: '32px', height: '36px' }} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Issued At</th>
                <th style={{ textAlign: 'right' }}>Certificate</th>
              </tr>
            </thead>
            <tbody>
              {!certificates || certificates.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <Award size={40} className="empty-state-icon" />
                      <p style={{ fontWeight: 500 }}>No certificates issued yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{(cert.users as any)?.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{(cert.users as any)?.email}</div>
                    </td>
                    <td>{(cert.courses as any)?.title}</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>{formatDate(cert.issued_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <a href={cert.certificate_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Award size={14} /> View
                      </a>
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
