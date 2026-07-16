import { FileCheck, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Submissions — Trainer' };

export default async function TrainerSubmissionsPage() {
  
  // Dummy data representing student submissions waiting for grading
  const submissions = [
    { id: '1', student: 'Alice Johnson', type: 'Coding Challenge', title: 'Two Sum', submittedAt: '2 hours ago', status: 'pending' },
    { id: '2', student: 'Bob Smith', type: 'Assignment', title: 'React Hooks Essay', submittedAt: '5 hours ago', status: 'pending' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">Submissions Inbox</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            Review and grade student work.
          </p>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
        <input type="text" placeholder="Search by student or title…" className="form-input" style={{ paddingLeft: '32px', height: '36px' }} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Submission Type</th>
                <th>Title</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <FileCheck size={40} className="empty-state-icon" />
                      <p style={{ fontWeight: 500 }}>No pending submissions</p>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 600 }}>{sub.student}</td>
                    <td><span className="badge badge-neutral">{sub.type}</span></td>
                    <td style={{ color: 'var(--color-muted)' }}>{sub.title}</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>{sub.submittedAt}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/trainer/submissions/${sub.id}`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Grade <ChevronRight size={14} />
                      </Link>
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
