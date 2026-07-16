import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CodingIDE } from './CodingIDE';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentCodingChallengePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: question } = await supabase
    .from('coding_questions')
    .select('id, title, description, difficulty, time_limit_ms, memory_limit_mb')
    .eq('id', id)
    .single();

  if (!question) {
    notFound();
  }

  // Fetch test cases to run against
  const { data: testCases } = await supabase
    .from('coding_test_cases')
    .select('input, expected_output, is_hidden')
    .eq('question_id', id)
    .order('created_at', { ascending: true });

  return <CodingIDE question={question} testCases={testCases ?? []} />;
}
