import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '403 — Access Denied' };

export default function ForbiddenPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--color-border)', lineHeight: 1, marginBottom: '16px' }}>403</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>Access Denied</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
          You don&apos;t have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <Link href="/" className="btn btn-primary">Go to Dashboard</Link>
      </div>
    </div>
  );
}
