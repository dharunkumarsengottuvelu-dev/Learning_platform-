import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AssignmentsClient } from './AssignmentsClient';

export const metadata: Metadata = { title: 'Assignments — Admin' };

export default async function AssignmentsPage() {
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from('assignments')
    .select(`
      id, title, description, max_marks, due_date, created_at,
      users!created_by(full_name)
    `)
    .order('created_at', { ascending: false });

  return <AssignmentsClient assignments={(assignments as any) ?? []} />;
}
