import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CodingClient } from './CodingClient';

export const metadata: Metadata = { title: 'Coding Challenges — Admin' };

export default async function CodingPage() {
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from('coding_questions')
    .select(`
      id, title, difficulty, time_limit_ms, memory_limit_mb, created_at,
      users!created_by(full_name)
    `)
    .order('created_at', { ascending: false });

  return <CodingClient questions={(questions as any) ?? []} />;
}
