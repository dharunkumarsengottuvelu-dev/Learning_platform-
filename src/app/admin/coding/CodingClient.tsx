'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Plus, Search, Code2, Pencil, Trash2,
  MoreHorizontal, Loader2, Gauge
} from 'lucide-react';
import { createCodingQuestionAction, updateCodingQuestionAction, deleteCodingQuestionAction } from '@/actions/coding.actions';
import { codingQuestionSchema, type CodingQuestionFormValues } from '@/validators';
import { formatDate, truncate } from '@/lib/utils';

interface Question {
  id: string;
  title: string;
  difficulty: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  created_at: string;
  users?: { full_name: string } | null;
}

interface Props {
  questions: Question[];
}

const DIFF_COLORS: Record<string, string> = {
  easy: 'badge-success',
  medium: 'badge-warning',
  hard: 'badge-danger',
};

export function CodingClient({ questions }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CodingQuestionFormValues>({
    resolver: zodResolver(codingQuestionSchema),
  });

  const filtered = questions.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingQuestion(null);
    reset({
      title: '', description: '', difficulty: 'medium',
      time_limit_ms: 2000, memory_limit_mb: 256
    });
    setShowModal(true);
  };

  const openEdit = (question: Question) => {
    setEditingQuestion(question);
    reset({
      title: question.title, description: '...', // We only edit metadata here, description in detail view
      difficulty: question.difficulty as any,
      time_limit_ms: question.time_limit_ms, memory_limit_mb: question.memory_limit_mb
    });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const onSubmit = async (data: CodingQuestionFormValues) => {
    let result;
    if (editingQuestion) {
      result = await updateCodingQuestionAction(editingQuestion.id, data);
    } else {
      result = await createCodingQuestionAction(data);
    }

    if (!result.success) { toast.error(result.error); return; }
    toast.success(editingQuestion ? 'Question updated' : 'Question created');
    setShowModal(false);
    reset();
    router.refresh();
  };

  const handleDelete = (question: Question) => {
    if (!confirm(`Delete question "${question.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteCodingQuestionAction(question.id);
      if (!result.success) toast.error(result.error);
      else { toast.success('Question deleted'); router.refresh(); }
      setOpenMenuId(null);
    });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">Coding Challenges</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            {questions.length} challenge{questions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={16} /> New Challenge
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
        <input type="text" placeholder="Search challenges…" value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ paddingLeft: '32px', height: '36px' }} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Challenge</th>
                <th>Difficulty</th>
                <th>Limits</th>
                <th>Created By</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <Code2 size={40} className="empty-state-icon" />
                      <p style={{ fontWeight: 500 }}>No challenges found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id}>
                    <td><div style={{ fontWeight: 600 }}>{truncate(q.title, 50)}</div></td>
                    <td><span className={`badge ${DIFF_COLORS[q.difficulty] ?? 'badge-neutral'}`}>{q.difficulty.toUpperCase()}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Gauge size={12} /> {q.time_limit_ms / 1000}s
                        </span>
                        <span>{q.memory_limit_mb}MB</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>{q.users?.full_name ?? '—'}</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>{formatDate(q.created_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenuId(openMenuId === q.id ? null : q.id)}>
                          <MoreHorizontal size={16} />
                        </button>
                        {openMenuId === q.id && (
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', width: '160px', background: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', zIndex: 20, overflow: 'hidden' }}>
                            <button onClick={() => { router.push(`/admin/coding/${q.id}`); setOpenMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                              <Code2 size={14} /> Test Cases
                            </button>
                            <button onClick={() => openEdit(q)} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                              <Pencil size={14} /> Edit Limits
                            </button>
                            <div style={{ borderTop: '1px solid var(--color-border)' }}>
                              <button onClick={() => handleDelete(q)} disabled={isPending} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-bg)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '20px' }}>{editingQuestion ? 'Edit Challenge' : 'New Challenge'}</h3>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Title *</label>
                <input {...register('title')} className="form-input" placeholder="Challenge title" />
                {errors.title && <p className="form-error">{errors.title.message}</p>}
              </div>
              {!editingQuestion && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Description (Markdown)</label>
                  <textarea {...register('description')} className="form-input" rows={4} placeholder="Describe the problem..." />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Difficulty</label>
                  <select {...register('difficulty')} className="form-input">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label className="form-label">Time Limit (ms)</label>
                  <input type="number" {...register('time_limit_ms', { valueAsNumber: true })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Memory Limit (MB)</label>
                  <input type="number" {...register('memory_limit_mb', { valueAsNumber: true })} className="form-input" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
