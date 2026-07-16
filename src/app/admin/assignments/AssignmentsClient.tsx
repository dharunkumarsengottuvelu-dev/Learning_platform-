'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Plus, Search, FileText, Pencil, Trash2,
  MoreHorizontal, Loader2, CalendarDays
} from 'lucide-react';
import { createAssignmentAction, updateAssignmentAction, deleteAssignmentAction } from '@/actions/assignment.actions';
import { assignmentSchema, type AssignmentFormValues } from '@/validators';
import { formatDate, truncate } from '@/lib/utils';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  max_marks: number;
  due_date: string | null;
  created_at: string;
  users?: { full_name: string } | null;
}

interface Props {
  assignments: Assignment[];
}

export function AssignmentsClient({ assignments }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
  });

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingAssignment(null);
    reset({ title: '', description: '', max_marks: 100, due_date: '' });
    setShowModal(true);
  };

  const openEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    reset({
      title: assignment.title, description: assignment.description ?? '',
      max_marks: assignment.max_marks,
      due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : undefined
    });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const onSubmit = async (data: AssignmentFormValues) => {
    let result;
    if (editingAssignment) {
      result = await updateAssignmentAction(editingAssignment.id, data);
    } else {
      result = await createAssignmentAction(data);
    }

    if (!result.success) { toast.error(result.error); return; }
    toast.success(editingAssignment ? 'Assignment updated' : 'Assignment created');
    setShowModal(false);
    reset();
    router.refresh();
  };

  const handleDelete = (assignment: Assignment) => {
    if (!confirm(`Delete assignment "${assignment.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteAssignmentAction(assignment.id);
      if (!result.success) toast.error(result.error);
      else { toast.success('Assignment deleted'); router.refresh(); }
      setOpenMenuId(null);
    });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">Assignments</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={16} /> New Assignment
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
        <input type="text" placeholder="Search assignments…" value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ paddingLeft: '32px', height: '36px' }} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Due Date</th>
                <th>Marks</th>
                <th>Created By</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <FileText size={40} className="empty-state-icon" />
                      <p style={{ fontWeight: 500 }}>No assignments found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{truncate(a.title, 50)}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>{truncate(a.description ?? '', 60)}</div>
                      </div>
                    </td>
                    <td>
                      {a.due_date ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                          <CalendarDays size={14} style={{ color: 'var(--color-muted)' }} />
                          {formatDate(a.due_date)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>No deadline</span>
                      )}
                    </td>
                    <td>{a.max_marks} pts</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>{a.users?.full_name ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}>
                          <MoreHorizontal size={16} />
                        </button>
                        {openMenuId === a.id && (
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', width: '160px', background: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', zIndex: 20, overflow: 'hidden' }}>
                            <button onClick={() => openEdit(a)} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                              <Pencil size={14} /> Edit
                            </button>
                            <div style={{ borderTop: '1px solid var(--color-border)' }}>
                              <button onClick={() => handleDelete(a)} disabled={isPending} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-bg)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
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
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '20px' }}>{editingAssignment ? 'Edit Assignment' : 'New Assignment'}</h3>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Title *</label>
                <input {...register('title')} className="form-input" placeholder="Assignment title" />
                {errors.title && <p className="form-error">{errors.title.message}</p>}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Description / Instructions</label>
                <textarea {...register('description')} className="form-input" rows={4} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label className="form-label">Due Date</label>
                  <input type="datetime-local" {...register('due_date')} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Max Marks</label>
                  <input type="number" {...register('max_marks', { valueAsNumber: true })} className="form-input" />
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
