import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { UsersClient } from './UsersClient';

export const metadata: Metadata = { title: 'Users — Admin' };

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active, created_at, designation, departments(name)')
    .order('created_at', { ascending: false });

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .order('name');

  return <UsersClient users={(users as any) ?? []} departments={(departments as any) ?? []} />;
}
