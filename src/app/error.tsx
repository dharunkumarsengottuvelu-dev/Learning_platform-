'use client';

import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--color-border)', lineHeight: 1, marginBottom: '16px' }}>500</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>Something went wrong</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '8px', lineHeight: 1.6 }}>
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-placeholder)', marginBottom: '32px', fontFamily: 'monospace' }}>
            Error ID: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
          <button onClick={reset} className="btn btn-primary">Try Again</button>
          <Link href="/" className="btn btn-secondary">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
