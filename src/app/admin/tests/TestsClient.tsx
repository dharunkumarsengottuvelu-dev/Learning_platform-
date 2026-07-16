'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Plus, Search, ClipboardList, Pencil, Trash2,
  MoreHorizontal, Loader2, Clock, Target
} from 'lucide-react';
import { createTestAction, updateTestAction, deleteTestAction } from '@/actions/test.actions';
import { testSchema, type TestFormValues } from '@/validators';
import { formatDate, truncate } from '@/lib/utils';

interface Test {
  id: string;
  title: string;
  description: string | null;
  test_type: string;
  duration_minutes: number | null;
  total_marks: number;
  pass_percentage: number;
  created_at: string;
  users?: { full_name: string } | null;
}

interface Props {
  tests: Test[];
}

export function TestsClient({ tests }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
  });

  const filtered = tests.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingTest(null);
    reset({
      title: '', description: '', test_type: 'mcq',
      duration_minutes: 60, total_marks: 100, pass_percentage: 60,
      negative_marking: false, negative_marks_per_wrong: 0,
      randomize_questions: false, allow_review: true, max_attempts: 1
    });
    setShowModal(true);
  };

  const openEdit = (test: Test) => {
    setEditingTest(test);
    reset({
      title: test.title, description: test.description ?? '',
      test_type: test.test_type as any, duration_minutes: test.duration_minutes ?? undefined,
      total_marks: test.total_marks, pass_percentage: test.pass_percentage,
    });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const onSubmit = async (data: TestFormValues) => {
    let result;
    if (editingTest) {
      result = await updateTestAction(editingTest.id, data);
    } else {
      result = await createTestAction(data);
    }

    if (!result.success) { toast.error(result.error); return; }
    toast.success(editingTest ? 'Test updated' : 'Test created');
    setShowModal(false);
    reset();
    router.refresh();
  };

  const handleDelete = (test: Test) => {
    if (!confirm(`Delete test "${test.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteTestAction(test.id);
      if (!result.success) toast.error(result.error);
      else { toast.success('Test deleted'); router.refresh(); }
      setOpenMenuId(null);
    });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">MCQ Tests</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            {tests.length} test{tests.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={16} /> New Test
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
        <input type="text" placeholder="Search tests…" value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ paddingLeft: '32px', height: '36px' }} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Test Title</th>
                <th>Settings</th>
                <th>Created By</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <ClipboardList size={40} className="empty-state-icon" />
                      <p style={{ fontWeight: 500 }}>No tests found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((test) => (
                  <tr key={test.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{truncate(test.title, 60)}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>{test.test_type.toUpperCase()}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {test.duration_minutes ?? 'No limit'} min
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Target size={12} /> {test.pass_percentage}% to pass
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>{test.users?.full_name ?? '—'}</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>{formatDate(test.created_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenuId(openMenuId === test.id ? null : test.id)}>
                          <MoreHorizontal size={16} />
                        </button>
                        {openMenuId === test.id && (
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', width: '160px', background: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', zIndex: 20, overflow: 'hidden' }}>
                            <button onClick={() => { router.push(`/admin/tests/${test.id}`); setOpenMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                              <ClipboardList size={14} /> Questions
                            </button>
                            <button onClick={() => openEdit(test)} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                              <Pencil size={14} /> Edit
                            </button>
                            <div style={{ borderTop: '1px solid var(--color-border)' }}>
                              <button onClick={() => handleDelete(test)} disabled={isPending} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-bg)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
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
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '20px' }}>{editingTest ? 'Edit Test' : 'New Test'}</h3>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Title *</label>
                <input {...register('title')} className="form-input" placeholder="Test title" />
                {errors.title && <p className="form-error">{errors.title.message}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Duration (mins)</label>
                  <input type="number" {...register('duration_minutes', { valueAsNumber: true })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Pass Percentage</label>
                  <input type="number" {...register('pass_percentage', { valueAsNumber: true })} className="form-input" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
