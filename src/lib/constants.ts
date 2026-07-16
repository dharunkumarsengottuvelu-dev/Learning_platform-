import type { UserRole } from '@/types';

/** Route protection map: which roles can access which path prefixes */
export const ROLE_ROUTES: Record<UserRole, string> = {
  super_admin: '/admin',
  admin: '/admin',
  manager: '/manager',
  trainer: '/trainer',
  student: '/student',
};

/** Default redirect after login per role */
export const ROLE_DEFAULT_REDIRECT: Record<UserRole, string> = {
  super_admin: '/admin/dashboard',
  admin: '/admin/dashboard',
  manager: '/manager/dashboard',
  trainer: '/trainer/dashboard',
  student: '/student/dashboard',
};

/** Routes accessible to all authenticated users regardless of role */
export const SHARED_PROTECTED_ROUTES = ['/profile', '/notifications', '/settings'];

/** Public routes that never require auth */
export const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/callback',
  '/auth/forgot-password',
  '/verify', // certificate verification — public
];

/** Programming language IDs for Judge0 */
export const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  java: 62,
  c: 50,
  cpp: 54,
  javascript: 63,
  typescript: 74,
  sql: 82,
};

/** File upload limits */
export const UPLOAD_LIMITS = {
  avatar: 2 * 1024 * 1024,        // 2 MB
  document: 20 * 1024 * 1024,     // 20 MB
  video: 500 * 1024 * 1024,       // 500 MB
  assignment: 50 * 1024 * 1024,   // 50 MB
};

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'image/jpeg',
  'image/png',
  'image/webp',
];

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;
