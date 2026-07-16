import { z } from 'zod';

// ─── Course ───────────────────────────────────────────────────────────────────

export const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const moduleSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  order_index: z.number().int().min(0).default(0),
});

export const chapterSchema = z.object({
  module_id: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  order_index: z.number().int().min(0).default(0),
});

export const topicSchema = z.object({
  chapter_id: z.string().uuid(),
  title: z.string().min(2).max(200),
  content_type: z.enum(['video', 'document', 'quiz', 'coding', 'assignment', 'link']),
  order_index: z.number().int().min(0).default(0),
  is_mandatory: z.boolean().default(true),
});

// ─── Test ─────────────────────────────────────────────────────────────────────

export const testSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  test_type: z.enum(['mcq', 'coding', 'subjective', 'mixed']).default('mcq'),
  duration_minutes: z.number().int().min(1).max(480).optional(),
  total_marks: z.number().min(0).max(10000).default(100),
  pass_percentage: z.number().min(0).max(100).default(60),
  negative_marking: z.boolean().default(false),
  negative_marks_per_wrong: z.number().min(0).default(0),
  randomize_questions: z.boolean().default(false),
  allow_review: z.boolean().default(true),
  max_attempts: z.number().int().min(1).max(10).default(1),
});

export const questionSchema = z.object({
  test_id: z.string().uuid(),
  question_text: z.string().min(5).max(5000),
  question_type: z.enum(['mcq', 'subjective', 'true_false']).default('mcq'),
  marks: z.number().min(0).max(100).default(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  explanation: z.string().max(2000).optional(),
  order_index: z.number().int().min(0).default(0),
});

export const questionOptionSchema = z.object({
  question_id: z.string().uuid(),
  option_text: z.string().min(1).max(1000),
  is_correct: z.boolean().default(false),
  order_index: z.number().int().min(0).default(0),
});

// ─── Coding ───────────────────────────────────────────────────────────────────

export const codingQuestionSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  time_limit_ms: z.number().int().min(500).max(30000).default(2000),
  memory_limit_mb: z.number().int().min(32).max(1024).default(256),
});

export const codingSubmissionSchema = z.object({
  question_id: z.string().uuid(),
  language: z.enum(['python', 'java', 'c', 'cpp', 'javascript', 'typescript', 'sql']),
  source_code: z.string().min(1).max(65535),
  test_attempt_id: z.string().uuid().optional(),
  is_submit: z.boolean().optional(),
});

// ─── Assignment ───────────────────────────────────────────────────────────────

export const assignmentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  due_date: z.string().optional(),
  max_marks: z.number().min(0).max(1000).default(100),
  topic_id: z.string().uuid().optional(),
});

// ─── User Management ──────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  full_name: z.string().min(2).max(200),
  email: z.string().email(),
  role: z.enum(['admin', 'employee', 'instructor', 'student']).default('student'),
  department_id: z.string().uuid().optional(),
  designation: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ email: true });

// ─── Notification ─────────────────────────────────────────────────────────────

export const notificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum([
    'course_assigned', 'test_assigned', 'assignment_assigned',
    'submission_reviewed', 'certificate_generated', 'announcement', 'deadline_reminder',
  ]),
  title: z.string().min(1).max(300),
  message: z.string().min(1).max(2000),
  link: z.string().url().optional(),
});

export type CourseFormValues = z.infer<typeof courseSchema>;
export type ModuleFormValues = z.infer<typeof moduleSchema>;
export type ChapterFormValues = z.infer<typeof chapterSchema>;
export type TopicFormValues = z.infer<typeof topicSchema>;
export type TestFormValues = z.infer<typeof testSchema>;
export type QuestionFormValues = z.infer<typeof questionSchema>;
export type QuestionOptionFormValues = z.infer<typeof questionOptionSchema>;
export type CodingQuestionFormValues = z.infer<typeof codingQuestionSchema>;
export type CodingSubmissionFormValues = z.infer<typeof codingSubmissionSchema>;
export type AssignmentFormValues = z.infer<typeof assignmentSchema>;
export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type NotificationFormValues = z.infer<typeof notificationSchema>;
