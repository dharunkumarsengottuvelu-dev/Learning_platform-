'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Plus, Search, UserCheck, UserX, Trash2, KeyRound,
  Loader2, MoreHorizontal, Shield
} from 'lucide-react';
import {
  createUserAction, toggleUserStatusAction,
  deleteUserAction, updateUserRoleAction, resetUserPasswordAction
} from '@/actions/user.actions';
import { createUserSchema, type CreateUserFormValues } from '@/validators';
import { formatDate, formatRole, getInitials } from '@/lib/utils';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  designation: string | null;
  departments?: { name: string } | null;
}

interface Dept { id: string; name: string; }

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'badge-danger',
  admin: 'badge-danger',
  manager: 'badge-warning',
  trainer: 'badge-info',
  student: 'badge-neutral',
};

export function UsersClient({ users, departments }: { users: User[]; departments: Dept[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
  });

  const filtered = users.filter((u) => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter ? u.role === roleFilter : true;
    return matchSearch && matchRole;
  });

  const onSubmit = async (data: CreateUserFormValues) => {
    const result = await createUserAction(data);
    if (!result.success) { toast.error(result.error); return; }
    toast.success('User created! A confirmation email has been sent.');
    setShowModal(false);
    reset();
    router.refresh();
  };

  const handleToggleStatus = (user: User) => {
    startTransition(async () => {
      const result = await toggleUserStatusAction(user.id, !user.is_active);
      if (!result.success) toast.error(result.error);
      else { toast.success(`User ${user.is_active ? 'suspended' : 'activated'}`); router.refresh(); }
      setOpenMenuId(null);
    });
  };

  const handleDelete = (user: User) => {
    if (!confirm(`Permanently delete ${user.full_name}? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteUserAction(user.id);
      if (!result.success) toast.error(result.error);
      else { toast.success('User deleted'); router.refresh(); }
      setOpenMenuId(null);
    });
  };

  const handleResetPassword = (userId: string) => {
    startTransition(async () => {
      const result = await resetUserPasswordAction(userId);
      if (!result.success) toast.error(result.error);
      else toast.success('Password reset link generated. Copy it from the console.');
      setOpenMenuId(null);
    });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">Users</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            {users.length} registered user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => { reset(); setShowModal(true); }} className="btn btn-primary">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '300px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
          <input type="text" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ paddingLeft: '32px', height: '36px' }} />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="form-input" style={{ width: '160px', height: '36px' }}>
          <option value="">All Roles</option>
          {['super_admin', 'admin', 'manager', 'trainer', 'student'].map((r) => (
            <option key={r} value={r}>{formatRole(r)}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><p>No users found.</p></div></td></tr>
              ) : filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--color-primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
                      }}>
                        {getInitials(user.full_name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {['super_admin', 'admin'].includes(user.role) && <Shield size={12} style={{ color: 'var(--color-danger)' }} />}
                      <span className={`badge ${ROLE_COLORS[user.role] ?? 'badge-neutral'}`}>{formatRole(user.role)}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>
                    {user.departments?.name ?? '—'}
                  </td>
                  <td>
                    <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {user.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>{formatDate(user.created_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}>
                        <MoreHorizontal size={16} />
                      </button>
                      {openMenuId === user.id && (
                        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', width: '180px', background: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', zIndex: 20, overflow: 'hidden' }}>
                          {[
                            { label: user.is_active ? 'Suspend User' : 'Activate User', icon: user.is_active ? UserX : UserCheck, action: () => handleToggleStatus(user) },
                            { label: 'Reset Password', icon: KeyRound, action: () => handleResetPassword(user.id) },
                          ].map(({ label, icon: Icon, action }) => (
                            <button key={label} onClick={action} disabled={isPending} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                              <Icon size={14} /> {label}
                            </button>
                          ))}
                          <div style={{ borderTop: '1px solid var(--color-border)' }}>
                            <button onClick={() => handleDelete(user)} disabled={isPending} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-bg)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '20px' }}>Add New User</h3>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input {...register('full_name')} className="form-input" placeholder="John Smith" />
                  {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="form-label">Email *</label>
                  <input {...register('email')} type="email" className="form-input" placeholder="user@company.com" />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label">Role</label>
                  <select {...register('role')} className="form-input">
                    <option value="student">Student</option>
                    <option value="trainer">Trainer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <select {...register('department_id')} className="form-input">
                    <option value="">None</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Designation</label>
                <input {...register('designation')} className="form-input" placeholder="e.g. Software Engineer" />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
