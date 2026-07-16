import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginClient } from '@/features/auth/components/LoginClient';

export const metadata: Metadata = {
  title: 'Sign In — Training Compiler',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '32px', color: 'var(--color-muted)' }}>Loading…</div>}>
      <LoginClient />
    </Suspense>
  );
}
