import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { MCQEngine } from './MCQEngine';

export default async function MCQTestPage({ params }: { params: any }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: test, error } = await supabase
    .from('tests')
    .select('*, mcq_questions(*, mcq_options(*))')
    .eq('id', id)
    .single();

  if (error || !test) {
    console.error(error);
    notFound();
  }

  // Format questions to hide correct answers from the client
  // In a real secure app, we wouldn't send `is_correct` to the client at all,
  // we would send the answers to the server to grade.
  // For this demo, we'll strip `is_correct` and handle grading via server action later.
  const formattedQuestions = test.mcq_questions?.map((q: Record<string, any>) => {
    return {
      id: q.id,
      text: q.question_text,
      type: q.question_type,
      marks: q.marks,
      options: q.mcq_options?.map((opt: Record<string, any>) => ({
        id: opt.id,
        text: opt.option_text,
      })) || []
    };
  }) || [];

  return <MCQEngine test={test} questions={formattedQuestions} />;
}
