'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function OnboardingPoller() {
  const router = useRouter();

  useEffect(() => {
    // Poll the server every 1.5 seconds.
    // Calling router.refresh() causes the Server Component to re-render.
    // Once the Server Component detects the profile row, it will trigger a server-side redirect,
    // which seamlessly navigates the user to their dashboard.
    const interval = setInterval(() => {
      router.refresh();
    }, 1500);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
