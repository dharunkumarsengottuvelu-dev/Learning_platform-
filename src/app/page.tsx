import { redirect } from 'next/navigation';

/**
 * Root page — redirect to login.
 * Once authenticated, middleware redirects to the role-based dashboard.
 */
export default function RootPage() {
  redirect('/auth/login');
}
