'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Bell, Send, Loader2 } from 'lucide-react';
import { sendAnnouncementAction } from '@/actions/notification.actions';
import { formatDate } from '@/lib/utils';

interface Notif {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  users?: { full_name: string; email: string } | null;
}

interface Props {
  notifications: Notif[];
}

export function NotificationsClient({ notifications }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) { toast.error('Title and message required'); return; }
    
    setIsSubmitting(true);
    const result = await sendAnnouncementAction({ title, message, target_role: targetRole || undefined, link: link || undefined });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success(`Announcement sent to ${result.data?.count} users`);
      setShowModal(false);
      setTitle(''); setMessage(''); setLink(''); setTargetRole('');
      router.refresh();
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 className="text-h2">Global Notifications</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            System-wide notification log
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Send size={16} /> Send Announcement
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Notification</th>
                <th>Recipient</th>
                <th>Status</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <Bell size={40} className="empty-state-icon" />
                      <p style={{ fontWeight: 500 }}>No notifications found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '2px' }}>
                          <span className="badge badge-info" style={{ marginRight: '8px' }}>{n.type}</span>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>{n.message}</div>
                      </div>
                    </td>
                    <td>
                      {n.users ? (
                        <>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{n.users.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{n.users.email}</div>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`badge ${n.is_read ? 'badge-neutral' : 'badge-warning'}`}>
                        {n.is_read ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>{formatDate(n.created_at)}</td>
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
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '20px' }}>Send Announcement</h3>
            <form onSubmit={handleSend}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Target Audience</label>
                <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="form-input">
                  <option value="">All Users</option>
                  <option value="student">Students</option>
                  <option value="trainer">Trainers</option>
                  <option value="manager">Managers</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" placeholder="Announcement title" required />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Message *</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="form-input" rows={4} required />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">Optional Link</label>
                <input value={link} onChange={(e) => setLink(e.target.value)} className="form-input" placeholder="https://" type="url" />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : 'Send Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
