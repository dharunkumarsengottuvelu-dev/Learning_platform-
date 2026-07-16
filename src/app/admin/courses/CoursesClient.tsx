'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Plus, Search, BookOpen, Pencil, Trash2,
  Globe, Archive, FileText, MoreHorizontal, Loader2
} from 'lucide-react';
import { createCourseAction, deleteCourseAction, updateCourseAction } from '@/actions/course.actions';
import { courseSchema, type CourseFormValues } from '@/validators';
import { formatDate, truncate } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  thumbnail_url: string | null;
  users?: { full_name: string } | null;
}

interface Props {
  courses: Course[];
}

const STATUS_CONFIG = {
  published: { label: 'Published', className: 'badge-success', icon: Globe },
  draft:     { label: 'Draft',     className: 'badge-neutral', icon: FileText },
  archived:  { label: 'Archived',  className: 'badge-warning', icon: Archive },
};

export function CoursesClient({ courses }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({ resolver: zodResolver(courseSchema) });

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingCourse(null);
    reset({ title: '', description: '', status: 'draft' });
    setShowModal(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    reset({
      title: course.title,
      description: course.description ?? '',
      status: course.status as 'draft' | 'published' | 'archived',
    });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const onSubmit = async (data: CourseFormValues) => {
    let result;
    if (editingCourse) {
      result = await updateCourseAction(editingCourse.id, data);
    } else {
      result = await createCourseAction(data);
    }

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(editingCourse ? 'Course updated!' : 'Course created!');
    setShowModal(false);
    reset();
    router.refresh();
  };

  const handleDelete = (course: Course) => {
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteCourseAction(course.id);
      if (!result.success) toast.error(result.error);
      else { toast.success('Course deleted'); router.refresh(); }
    });
    setOpenMenuId(null);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">Courses</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            {courses.length} course{courses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={16} /> New Course
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
        <input
          type="text"
          placeholder="Search courses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '32px', height: '36px' }}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
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
                      <BookOpen size={40} className="empty-state-icon" />
                      <p style={{ fontWeight: 500 }}>No courses found</p>
                      <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>Create your first course to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((course) => {
                  const cfg = STATUS_CONFIG[course.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={course.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                            {truncate(course.title, 60)}
                          </div>
                          {course.description && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                              {truncate(course.description, 80)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${cfg.className}`}>
                          <StatusIcon size={11} />
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>
                        {course.users?.full_name ?? '—'}
                      </td>
                      <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>
                        {formatDate(course.created_at)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {openMenuId === course.id && (
                            <div style={{
                              position: 'absolute', right: 0, top: 'calc(100% + 4px)',
                              width: '160px', background: 'white',
                              border: '1px solid var(--color-border)',
                              borderRadius: '8px', boxShadow: 'var(--shadow-lg)',
                              zIndex: 20, overflow: 'hidden',
                            }}>
                              <button
                                onClick={() => { router.push(`/admin/courses/${course.id}`); setOpenMenuId(null); }}
                                style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                              >
                                <BookOpen size={14} /> View / Edit
                              </button>
                              <button
                                onClick={() => openEdit(course)}
                                style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                              >
                                <Pencil size={14} /> Edit Details
                              </button>
                              <div style={{ borderTop: '1px solid var(--color-border)' }}>
                                <button
                                  onClick={() => handleDelete(course)}
                                  disabled={isPending}
                                  style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-bg)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal — Add/Edit Course */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }} onClick={() => setShowModal(false)}>
          <div
            className="card"
            style={{ width: '100%', maxWidth: '480px', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '20px' }}>
              {editingCourse ? 'Edit Course' : 'New Course'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Course Title *</label>
                <input {...register('title')} className="form-input" placeholder="e.g. Introduction to Python" />
                {errors.title && <p className="form-error">{errors.title.message}</p>}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Description</label>
                <textarea
                  {...register('description')}
                  className="form-input"
                  placeholder="Brief description of the course…"
                  rows={3}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">Status</label>
                <select {...register('status')} className="form-input">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : (editingCourse ? 'Update' : 'Create Course')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
