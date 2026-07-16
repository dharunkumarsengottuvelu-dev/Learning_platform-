// ─── Role & User Types ────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'employee' | 'instructor' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  department_id: string | null;
  designation: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Department & Batch ───────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Batch {
  id: string;
  name: string;
  department_id: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

// ─── Course Hierarchy ─────────────────────────────────────────────────────────

export type CourseStatus = 'draft' | 'published' | 'archived';
export type ContentType = 'video' | 'document' | 'quiz' | 'coding' | 'assignment' | 'link';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: CourseStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface Topic {
  id: string;
  chapter_id: string;
  title: string;
  content_type: ContentType;
  order_index: number;
  is_mandatory: boolean;
  created_at: string;
}

// ─── Course Assignment ────────────────────────────────────────────────────────

export type AssignmentType = 'individual' | 'batch' | 'department';
export type AssignmentStatus = 'active' | 'completed' | 'expired';

export interface CourseAssignment {
  id: string;
  course_id: string;
  assignee_type: AssignmentType;
  assignee_id: string;
  assigned_by: string;
  start_date: string | null;
  end_date: string | null;
  deadline: string | null;
  is_mandatory: boolean;
  status: AssignmentStatus;
  created_at: string;
}

// ─── Tests & Assessments ─────────────────────────────────────────────────────

export type TestType = 'mcq' | 'coding' | 'subjective' | 'mixed';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type TestAttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'auto_submitted';

export interface Test {
  id: string;
  title: string;
  description: string | null;
  test_type: TestType;
  duration_minutes: number | null;
  total_marks: number;
  pass_percentage: number;
  negative_marking: boolean;
  negative_marks_per_wrong: number;
  randomize_questions: boolean;
  allow_review: boolean;
  max_attempts: number;
  created_by: string;
  created_at: string;
}

export interface Question {
  id: string;
  test_id: string;
  question_text: string;
  question_type: 'mcq' | 'subjective' | 'true_false';
  marks: number;
  difficulty: DifficultyLevel;
  explanation: string | null;
  order_index: number;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  student_id: string;
  status: TestAttemptStatus;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
  attempt_number: number;
}

// ─── Coding Assessment ────────────────────────────────────────────────────────

export type ProgrammingLanguage = 'python' | 'java' | 'c' | 'cpp' | 'javascript' | 'typescript' | 'sql';

export interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  time_limit_ms: number;
  memory_limit_mb: number;
  starter_code: Record<string, string>; // { python: "...", java: "..." }
  created_by: string;
  created_at: string;
}

export interface CodingSubmission {
  id: string;
  question_id: string;
  student_id: string;
  test_attempt_id: string | null;
  language: ProgrammingLanguage;
  source_code: string;
  status: 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'compile_error';
  execution_time_ms: number | null;
  memory_used_mb: number | null;
  score: number | null;
  judge0_token: string | null;
  created_at: string;
}

// ─── Assignment Submissions ───────────────────────────────────────────────────

export type SubmissionStatus = 'pending' | 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'resubmit_requested';

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_urls: string[];
  notes: string | null;
  status: SubmissionStatus;
  grade: number | null;
  feedback: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'course_assigned'
  | 'test_assigned'
  | 'assignment_assigned'
  | 'submission_reviewed'
  | 'certificate_generated'
  | 'announcement'
  | 'deadline_reminder';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── Certificate ──────────────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  student_id: string;
  course_id: string;
  unique_id: string;
  issued_at: string;
  qr_code_url: string | null;
  pdf_url: string | null;
}

// ─── API Response Helpers ─────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
