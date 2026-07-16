'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitMCQAssessment } from '../../actions';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  type: string;
  marks: number;
  options: Option[];
}

interface Test {
  id: string;
  title: string;
  duration_minutes: number | null;
}

interface Props {
  test: Test;
  questions: Question[];
}

export function MCQEngine({ test, questions }: Props) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(test.duration_minutes ? test.duration_minutes * 60 : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!isStarted || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => (t ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isStarted]);

  const handleSelect = (questionId: string, optionId: string, isMultiple: boolean) => {
    setAnswers(prev => {
      if (!isMultiple) {
        return { ...prev, [questionId]: optionId };
      }
      const current = (prev[questionId] as string[]) || [];
      if (current.includes(optionId)) {
        return { ...prev, [questionId]: current.filter(id => id !== optionId) };
      }
      return { ...prev, [questionId]: [...current, optionId] };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Convert all answers to string[] to match the action signature
    const formattedAnswers: Record<string, string[]> = {};
    for (const [qId, ans] of Object.entries(answers)) {
      formattedAnswers[qId] = Array.isArray(ans) ? ans : [ans];
    }
    
    startTransition(async () => {
      const result = await submitMCQAssessment(test.id, formattedAnswers);
      
      if (result.success) {
        toast.success(`Test submitted! You scored ${result.percentage?.toFixed(2)}%`);
        router.push('/student/assessments');
      } else {
        toast.error(result.error || 'Failed to submit test');
        setIsSubmitting(false);
      }
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isStarted) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <div className="card" style={{ padding: '40px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>{test.title}</h1>
          <p style={{ color: 'var(--color-muted)', marginBottom: '32px' }}>
            This test contains {questions.length} questions.
            {test.duration_minutes ? ` You have ${test.duration_minutes} minutes to complete it.` : ' There is no time limit.'}
            Once you start, the timer cannot be paused.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/student/assessments" className="btn btn-secondary">Cancel</Link>
            <button onClick={() => setIsStarted(true)} className="btn btn-primary">Start Test</button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>No Questions Found</h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: '32px' }}>This assessment does not have any questions assigned to it yet.</p>
          <Link href="/student/assessments" className="btn btn-primary">Go Back</Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--color-background)', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontWeight: 600 }}>{test.title}</h2>
        {timeLeft !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: timeLeft < 60 ? 'var(--color-danger)' : 'var(--color-foreground)', fontWeight: 600, fontSize: '1.125rem' }}>
            <Clock size={18} /> {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main Question Area */}
        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>Question {currentIdx + 1} of {questions.length}</span>
                <span className="badge badge-neutral">{currentQ.marks} Marks</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.5 }}>{currentQ.text}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentQ.options.map(opt => {
                const isMultiple = currentQ.type === 'multiple_select';
                const isSelected = isMultiple
                  ? ((answers[currentQ.id] as string[]) || []).includes(opt.id)
                  : answers[currentQ.id] === opt.id;

                return (
                  <label key={opt.id} style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                    border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: '12px', cursor: 'pointer',
                    background: isSelected ? 'var(--color-primary-10)' : 'var(--color-surface)',
                    transition: 'all 0.2s'
                  }}>
                    <input 
                      type={isMultiple ? "checkbox" : "radio"}
                      name={`q-${currentQ.id}`}
                      checked={isSelected}
                      onChange={() => handleSelect(currentQ.id, opt.id, isMultiple)}
                      style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: '1.0625rem', fontWeight: isSelected ? 500 : 400 }}>{opt.text}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              
              {currentIdx === questions.length - 1 ? (
                <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting || isPending}>
                  {(isSubmitting || isPending) ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><CheckCircle size={16} /> Submit Test</>}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}>
                  Next <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Question Navigator */}
        <div style={{ width: '280px', borderLeft: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '16px', textTransform: 'uppercase' }}>
            Navigator
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined && (Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).length > 0 : true);
              const isCurrent = idx === currentIdx;
              
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: isCurrent ? 'var(--color-primary)' : isAnswered ? 'var(--color-primary-10)' : 'var(--color-background)',
                    color: isCurrent ? 'white' : isAnswered ? 'var(--color-primary)' : 'var(--color-foreground)',
                    boxShadow: isCurrent ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          
          <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={handleSubmit} disabled={isSubmitting || isPending}>
              Finish Attempt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
