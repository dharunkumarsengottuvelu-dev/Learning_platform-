import { createClient } from '@/lib/supabase/server';
import { ClipboardList, Code2, ArrowRight, Target, Clock } from 'lucide-react';
import Link from 'next/link';
import { truncate } from '@/lib/utils';

export const metadata = { title: 'Assessments & Challenges' };

export default async function AssessmentsPage() {
  const supabase = await createClient();

  // Fetch published MCQ Tests
  const { data: tests } = await supabase
    .from('tests')
    .select('id, title, description, duration_minutes, test_type, total_marks')
    .order('created_at', { ascending: false });

  // Fetch Coding Challenges
  const { data: coding } = await supabase
    .from('coding_questions')
    .select('id, title, difficulty, time_limit_ms, memory_limit_mb')
    .order('created_at', { ascending: false });

  const DIFF_COLORS: Record<string, string> = {
    easy: 'badge-success', medium: 'badge-warning', hard: 'badge-danger'
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 className="text-h2">Assessments & Challenges</h2>
        <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
          Complete your required assessments and practice your coding skills.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Left Column: MCQ Tests */}
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} style={{ color: 'var(--color-primary)' }} />
            MCQ Tests
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!tests || tests.length === 0 ? (
              <div className="card empty-state">
                <p>No tests assigned.</p>
              </div>
            ) : (
              tests.map((test) => (
                <div key={test.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '1.0625rem' }}>{test.title}</h4>
                    <span className="badge badge-neutral">{test.test_type.toUpperCase()}</span>
                  </div>
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '16px', minHeight: '40px' }}>
                    {truncate(test.description ?? 'No description provided.', 80)}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--color-muted)', fontSize: '0.8125rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {test.duration_minutes ?? 'No limit'} min
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Target size={14} /> {test.total_marks} pts
                      </span>
                    </div>
                    <Link href={`/student/assessments/mcq/${test.id}`} className="btn btn-primary btn-sm">
                      Start Test <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Coding Challenges */}
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code2 size={20} style={{ color: 'var(--color-info)' }} />
            Coding Challenges
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!coding || coding.length === 0 ? (
              <div className="card empty-state">
                <p>No coding challenges available.</p>
              </div>
            ) : (
              coding.map((q) => (
                <div key={q.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '1.0625rem' }}>{q.title}</h4>
                    <span className={`badge ${DIFF_COLORS[q.difficulty] ?? 'badge-neutral'}`}>{q.difficulty.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--color-muted)', fontSize: '0.8125rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {q.time_limit_ms / 1000}s limit
                      </span>
                    </div>
                    <Link href={`/student/assessments/coding/${q.id}`} className="btn btn-secondary btn-sm">
                      Solve Challenge <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
