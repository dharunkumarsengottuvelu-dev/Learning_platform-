import { ChevronLeft, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Grade Submission — Trainer' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GradeSubmissionPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', height: 'calc(100vh - 140px)', gap: '24px' }}>
      {/* Left side: Submission details/Code */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--color-surface)' }}>
          <Link href="/trainer/submissions" className="btn btn-ghost btn-icon" style={{ marginLeft: '-8px' }}>
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Two Sum (Submission #{id})</h2>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>Student: Alice Johnson • Submitted: 2 hours ago</div>
          </div>
        </div>
        
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace' }}>
          <pre>
            <code>
{`function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`}
            </code>
          </pre>
        </div>
      </div>

      {/* Right side: Grading panel */}
      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>Evaluation</h3>
        
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label">Score (out of 100)</label>
          <input type="number" className="form-input" placeholder="e.g. 95" />
        </div>

        <div style={{ flex: 1, marginBottom: '24px' }}>
          <label className="form-label">Feedback / Remarks</label>
          <textarea className="form-input" rows={10} placeholder="Provide constructive feedback here..." style={{ height: '100%', resize: 'none' }}></textarea>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ flex: 1, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
            <XCircle size={16} /> Reject
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }}>
            <CheckCircle size={16} /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}
