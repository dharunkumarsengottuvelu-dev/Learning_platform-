import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { TestsClient } from './TestsClient';

export const metadata: Metadata = { title: 'MCQ Tests — Admin' };

export default async function TestsPage() {
  const supabase = await createClient();

  const { data: tests } = await supabase
    .from('tests')
    .select(`
      id, title, description, test_type, duration_minutes, total_marks, pass_percentage,
      created_at, users!created_by(full_name)
    `)
    .order('created_at', { ascending: false });

  return <TestsClient tests={(tests as any) ?? []} />;
}
