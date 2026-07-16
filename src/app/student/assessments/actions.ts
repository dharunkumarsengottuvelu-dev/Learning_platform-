'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitMCQAssessment(testId: string, answers: Record<string, string[]>) {
  try {
    const supabase = await createClient();

    // 1. Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // 2. Fetch the test details and all questions/options
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*, mcq_questions(*, mcq_options(*))')
      .eq('id', testId)
      .single();

    if (testError || !test) {
      throw new Error('Test not found');
    }

    // 3. Calculate score and prepare submission records
    let score = 0;
    let correctCount = 0;
    const totalQuestions = test.mcq_questions.length;
    const submissionsToInsert: any[] = [];

    test.mcq_questions.forEach((q: any) => {
      const studentAnswers = answers[q.id] || [];
      const correctOptions = q.mcq_options
        .filter((o: any) => o.is_correct)
        .map((o: any) => o.id);

      // Simple grading: exact match of correct options
      let isCorrect = false;
      let marksAwarded = 0;

      if (
        studentAnswers.length > 0 &&
        studentAnswers.length === correctOptions.length &&
        studentAnswers.every((id) => correctOptions.includes(id))
      ) {
        isCorrect = true;
        marksAwarded = q.marks;
        score += q.marks;
        correctCount += 1;
      } else if (studentAnswers.length > 0 && test.negative_marking) {
        score -= test.negative_marks_per_wrong || 0; 
      }

      submissionsToInsert.push({
        test_id: testId,
        student_id: user.id,
        question_id: q.id,
        selected_options: studentAnswers,
        is_correct: isCorrect,
        marks_awarded: marksAwarded
      });
    });

    const percentage = (score / test.total_marks) * 100;
    const passed = percentage >= test.pass_percentage;

    // 4. Update the test attempt (now called results)
    const { error: resultError } = await supabase
      .from('results')
      .update({
        status: 'submitted',
        score: score,
        percentage: percentage,
        passed: passed,
        completed_at: new Date().toISOString(),
      })
      .eq('test_id', testId)
      .eq('student_id', user.id)
      .eq('status', 'in_progress');

    if (resultError) {
      throw new Error('Failed to update test result: ' + resultError.message);
    }

    // 5. Insert individual question submissions
    if (submissionsToInsert.length > 0) {
      const { error: subError } = await supabase
        .from('mcq_submissions')
        .insert(submissionsToInsert);
        
      if (subError) {
        console.error('Failed to save individual mcq submissions:', subError);
      }
    }

    revalidatePath(`/student/assessments/mcq/${testId}`);
    
    return {
      success: true,
      score,
      percentage,
      passed,
      correctCount,
      totalQuestions
    };

  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit assessment'
    };
  }
}
