-- ============================================================
-- TechTrain LMS - Complete Database Reset & Schema Creation
-- INSTRUCTIONS: Copy and paste this entire file into the Supabase SQL Editor and hit "Run".
-- WARNING: THIS WILL DELETE ALL EXISTING DATA IN YOUR PUBLIC SCHEMA!
-- ============================================================

-- 1. DROP EXISTING SCHEMA TO CLEAN SLATE (Be careful!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  -- Added 'instructor' to user_role based on UI requirements
  CREATE TYPE public.user_role AS ENUM ('student', 'employee', 'instructor', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.course_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.test_type AS ENUM ('mcq', 'coding', 'mixed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.test_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.submission_verdict AS ENUM (
    'accepted', 'wrong_answer', 'time_limit_exceeded',
    'memory_limit_exceeded', 'runtime_error', 'compilation_error', 'pending'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.violation_type AS ENUM (
    'fullscreen_exit', 'tab_switch', 'copy', 'paste', 'right_click',
    'devtools_open', 'window_blur', 'browser_refresh', 'escape_key',
    'no_face', 'multiple_faces', 'face_away', 'camera_disabled'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.video_type AS ENUM ('upload', 'youtube', 'vimeo');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.mcq_question_type AS ENUM ('single', 'multiple', 'true_false', 'image', 'code_snippet');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'warning', 'error', 'announcement');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLES
-- ============================================================

-- 1. Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  role          public.user_role NOT NULL DEFAULT 'student',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_email    ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role     ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active   ON public.users(is_active) WHERE deleted_at IS NULL;

-- 2. Student Profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  college_name  TEXT,
  batch_name    TEXT,
  roll_number   TEXT,
  phone         TEXT,
  bio           TEXT,
  linkedin_url  TEXT,
  github_url    TEXT,
  coding_streak INTEGER NOT NULL DEFAULT 0,
  total_points  INTEGER NOT NULL DEFAULT 0,
  rank          INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON public.student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_points ON public.student_profiles(total_points DESC);

-- 3. Employee Profiles
CREATE TABLE IF NOT EXISTS public.employee_profiles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  department   TEXT,
  designation  TEXT,
  phone        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title              TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  description        TEXT NOT NULL DEFAULT '',
  thumbnail_url      TEXT,
  instructor_id      UUID NOT NULL REFERENCES public.users(id),
  category           TEXT NOT NULL,
  difficulty         public.difficulty_level NOT NULL DEFAULT 'easy',
  status             public.course_status NOT NULL DEFAULT 'draft',
  duration_hours     DECIMAL(5,1),
  is_sequential      BOOLEAN NOT NULL DEFAULT false,
  lock_on_completion BOOLEAN NOT NULL DEFAULT false,
  min_passing_score  INTEGER NOT NULL DEFAULT 60,
  mandatory_practice BOOLEAN NOT NULL DEFAULT false,
  total_modules      INTEGER NOT NULL DEFAULT 0,
  total_topics       INTEGER NOT NULL DEFAULT 0,
  enrolled_count     INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_courses_category   ON public.courses(category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_status     ON public.courses(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug       ON public.courses(slug);

-- 6. Course Reviews
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- 7. Course Modules
CREATE TABLE IF NOT EXISTS public.course_modules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_locked   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.course_modules(course_id, order_index);

-- 8. Topics
CREATE TABLE IF NOT EXISTS public.topics (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id        UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  order_index      INTEGER NOT NULL DEFAULT 0,
  is_locked        BOOLEAN NOT NULL DEFAULT false,
  has_video        BOOLEAN NOT NULL DEFAULT false,
  has_notes        BOOLEAN NOT NULL DEFAULT false,
  has_practice     BOOLEAN NOT NULL DEFAULT false,
  has_quiz         BOOLEAN NOT NULL DEFAULT false,
  has_assignment   BOOLEAN NOT NULL DEFAULT false,
  video_url        TEXT,
  video_type       public.video_type,
  notes_url        TEXT,
  source_code_url  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_topics_module ON public.topics(module_id, order_index);

-- 9. Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id         UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress_percent  INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  completed_topics  UUID[] NOT NULL DEFAULT '{}',
  enrolled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  last_accessed_at  TIMESTAMPTZ,
  UNIQUE(student_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course  ON public.enrollments(course_id);

-- 10. Lesson Progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic_id     UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, topic_id)
);

-- 11. Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id    UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  max_score   INTEGER NOT NULL DEFAULT 100,
  created_by  UUID NOT NULL REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Assignment Submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_url      TEXT,
  text_content  TEXT,
  grade         INTEGER,
  feedback      TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graded_at     TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- 13. Coding Questions
CREATE TABLE IF NOT EXISTS public.coding_questions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT NOT NULL,
  difficulty          public.difficulty_level NOT NULL DEFAULT 'easy',
  constraints         TEXT,
  input_format        TEXT,
  output_format       TEXT,
  time_limit_ms       INTEGER NOT NULL DEFAULT 2000,
  memory_limit_mb     INTEGER NOT NULL DEFAULT 256,
  supported_languages TEXT[] NOT NULL DEFAULT '{"c","cpp","java","python","javascript"}',
  tags                TEXT[] NOT NULL DEFAULT '{}',
  hints               TEXT[] NOT NULL DEFAULT '{}',
  editorial           TEXT,
  solution_code       TEXT,
  topic_id            UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  created_by          UUID NOT NULL REFERENCES public.users(id),
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coding_q_topic      ON public.coding_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_coding_q_difficulty ON public.coding_questions(difficulty) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coding_q_slug       ON public.coding_questions(slug);

-- 14. Coding Test Cases
CREATE TABLE IF NOT EXISTS public.coding_test_cases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id     UUID NOT NULL REFERENCES public.coding_questions(id) ON DELETE CASCADE,
  input           TEXT NOT NULL DEFAULT '',
  expected_output TEXT NOT NULL DEFAULT '',
  is_hidden       BOOLEAN NOT NULL DEFAULT false,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_test_cases_question ON public.coding_test_cases(question_id, order_index);

-- 15. MCQ Questions
CREATE TABLE IF NOT EXISTS public.mcq_questions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id       UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  question_text  TEXT NOT NULL,
  question_type  public.mcq_question_type NOT NULL DEFAULT 'single',
  image_url      TEXT,
  code_snippet   TEXT,
  code_language  TEXT,
  explanation    TEXT,
  difficulty     public.difficulty_level NOT NULL DEFAULT 'easy',
  tags           TEXT[] NOT NULL DEFAULT '{}',
  negative_marks DECIMAL(4,2) NOT NULL DEFAULT 0,
  created_by     UUID NOT NULL REFERENCES public.users(id),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mcq_topic      ON public.mcq_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_mcq_difficulty ON public.mcq_questions(difficulty) WHERE is_active = true;

-- 16. MCQ Options
CREATE TABLE IF NOT EXISTS public.mcq_options (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id      UUID NOT NULL REFERENCES public.mcq_questions(id) ON DELETE CASCADE,
  option_text      TEXT NOT NULL,
  option_image_url TEXT,
  is_correct       BOOLEAN NOT NULL DEFAULT false,
  order_index      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_mcq_options_question ON public.mcq_options(question_id, order_index);

-- 17. Tests
CREATE TABLE IF NOT EXISTS public.tests (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                   TEXT NOT NULL,
  description             TEXT,
  type                    public.test_type NOT NULL DEFAULT 'mcq',
  status                  public.test_status NOT NULL DEFAULT 'draft',
  duration_minutes        INTEGER NOT NULL DEFAULT 60,
  passing_marks           INTEGER NOT NULL DEFAULT 0,
  negative_marks          DECIMAL(4,2) NOT NULL DEFAULT 0,
  total_marks             INTEGER NOT NULL DEFAULT 0,
  start_time              TIMESTAMPTZ,
  end_time                TIMESTAMPTZ,
  attempts_allowed        INTEGER NOT NULL DEFAULT 1,
  shuffle_questions       BOOLEAN NOT NULL DEFAULT false,
  shuffle_options         BOOLEAN NOT NULL DEFAULT false,
  certificate_enabled     BOOLEAN NOT NULL DEFAULT false,
  face_monitoring_enabled BOOLEAN NOT NULL DEFAULT false,
  anti_cheat_enabled      BOOLEAN NOT NULL DEFAULT true,
  fullscreen_required     BOOLEAN NOT NULL DEFAULT true,
  max_violations          INTEGER NOT NULL DEFAULT 3,
  instructions            TEXT,
  created_by              UUID NOT NULL REFERENCES public.users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tests_status     ON public.tests(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tests_type       ON public.tests(type);
CREATE INDEX IF NOT EXISTS idx_tests_start_time ON public.tests(start_time);

-- 18. Test Sections
CREATE TABLE IF NOT EXISTS public.test_sections (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id            UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  type               TEXT NOT NULL CHECK (type IN ('mcq', 'coding')),
  order_index        INTEGER NOT NULL DEFAULT 0,
  question_ids       UUID[] NOT NULL DEFAULT '{}',
  marks_per_question DECIMAL(5,2) NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sections_test ON public.test_sections(test_id, order_index);

-- 19. Test Assignments
CREATE TABLE IF NOT EXISTS public.test_assignments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id    UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(test_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_test_assignments_test    ON public.test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_student ON public.test_assignments(student_id);

-- 20. Coding Submissions
CREATE TABLE IF NOT EXISTS public.coding_submissions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id         UUID NOT NULL REFERENCES public.users(id),
  question_id        UUID NOT NULL REFERENCES public.coding_questions(id),
  test_id            UUID REFERENCES public.tests(id) ON DELETE SET NULL,
  language           TEXT NOT NULL,
  source_code        TEXT NOT NULL,
  verdict            public.submission_verdict NOT NULL DEFAULT 'pending',
  score              INTEGER NOT NULL DEFAULT 0,
  execution_time_ms  INTEGER,
  memory_used_mb     INTEGER,
  test_cases_passed  INTEGER NOT NULL DEFAULT 0,
  test_cases_total   INTEGER NOT NULL DEFAULT 0,
  error_message      TEXT,
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_submissions_student  ON public.coding_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_question ON public.coding_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_submissions_test     ON public.coding_submissions(test_id);

-- 21. MCQ Submissions
CREATE TABLE IF NOT EXISTS public.mcq_submissions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES public.users(id),
  test_id             UUID NOT NULL REFERENCES public.tests(id),
  question_id         UUID NOT NULL REFERENCES public.mcq_questions(id),
  selected_option_ids UUID[] NOT NULL DEFAULT '{}',
  is_correct          BOOLEAN NOT NULL DEFAULT false,
  marks_awarded       DECIMAL(5,2) NOT NULL DEFAULT 0,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, test_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_mcq_sub_student ON public.mcq_submissions(student_id, test_id);

-- 22. Test Results
CREATE TABLE IF NOT EXISTS public.results (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id         UUID NOT NULL REFERENCES public.users(id),
  test_id            UUID NOT NULL REFERENCES public.tests(id),
  total_marks        INTEGER NOT NULL DEFAULT 0,
  marks_obtained     DECIMAL(6,2) NOT NULL DEFAULT 0,
  accuracy           DECIMAL(5,2) NOT NULL DEFAULT 0,
  correct_answers    INTEGER NOT NULL DEFAULT 0,
  wrong_answers      INTEGER NOT NULL DEFAULT 0,
  unattempted        INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  rank               INTEGER,
  percentile         DECIMAL(5,2),
  passed             BOOLEAN NOT NULL DEFAULT false,
  violation_count    INTEGER NOT NULL DEFAULT 0,
  certificate_id     UUID,
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, test_id)
);
CREATE INDEX IF NOT EXISTS idx_results_student ON public.results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_test    ON public.results(test_id);

-- 23. Certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id         UUID NOT NULL REFERENCES public.users(id),
  test_id            UUID REFERENCES public.tests(id) ON DELETE SET NULL,
  course_id          UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  title              TEXT NOT NULL,
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pdf_url            TEXT,
  qr_code_url        TEXT,
  is_revoked         BOOLEAN NOT NULL DEFAULT false,
  revoked_at         TIMESTAMPTZ,
  revoked_reason     TEXT
);
CREATE INDEX IF NOT EXISTS idx_certs_student ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certs_number  ON public.certificates(certificate_number);

-- 24. Anti-Cheat Logs
CREATE TABLE IF NOT EXISTS public.anti_cheat_logs (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id             UUID NOT NULL REFERENCES public.users(id),
  test_id                UUID NOT NULL REFERENCES public.tests(id),
  violation_type         public.violation_type NOT NULL,
  details                TEXT,
  timestamp              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  warning_count_at_time  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_anti_cheat_student ON public.anti_cheat_logs(student_id, test_id);

-- 25. Face Monitor Logs
CREATE TABLE IF NOT EXISTS public.face_monitor_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID NOT NULL REFERENCES public.users(id),
  test_id      UUID NOT NULL REFERENCES public.tests(id),
  event_type   public.violation_type NOT NULL,
  snapshot_url TEXT,
  confidence   DECIMAL(5,4),
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_face_monitor_student ON public.face_monitor_logs(student_id, test_id);

-- 26. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       public.notification_type NOT NULL DEFAULT 'info',
  is_read    BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- 27. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  target_role  TEXT NOT NULL DEFAULT 'all',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  created_by   UUID NOT NULL REFERENCES public.users(id)
);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active, published_at DESC);

-- 28. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  details     JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_user    ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity  ON public.activity_logs(entity_type, entity_id);

-- 29. Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT NOT NULL UNIQUE,
  value       TEXT NOT NULL,
  description TEXT,
  updated_by  UUID NOT NULL REFERENCES public.users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 30. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  course_id      UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  amount         DECIMAL(10,2) NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'USD',
  status         public.payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS (auto-update updated_at)
-- ============================================================
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'student_profiles', 'employee_profiles', 'courses',
    'course_reviews', 'assignments', 'assignment_submissions',
    'course_modules', 'topics', 'coding_questions', 'mcq_questions',
    'tests', 'settings', 'payments'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_update_%1$s ON public.%1$s;
       CREATE TRIGGER trg_update_%1$s
       BEFORE UPDATE ON public.%1$s
       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();',
      t
    );
  END LOOP;
END $$;

-- ============================================================
-- GRANTS (Required for Supabase API access after dropping schema)
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_test_cases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_options        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_submissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anti_cheat_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_monitor_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Users RLS
CREATE POLICY "users_select_own"       ON public.users FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "users_select_employees" ON public.users FOR SELECT USING (public.get_user_role() = 'employee');
CREATE POLICY "users_update_own"       ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_admin_all"        ON public.users FOR ALL USING (public.is_admin());

-- Student Profiles RLS
CREATE POLICY "sp_select_own"  ON public.student_profiles FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR public.get_user_role() = 'employee');
CREATE POLICY "sp_update_own"  ON public.student_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "sp_admin_all"   ON public.student_profiles FOR ALL USING (public.is_admin());

-- Courses RLS
CREATE POLICY "courses_read_published" ON public.courses FOR SELECT USING (status = 'published' OR public.is_admin() OR public.get_user_role() = 'employee' OR public.get_user_role() = 'instructor');
CREATE POLICY "courses_admin_all"      ON public.courses FOR ALL USING (public.is_admin() OR public.get_user_role() = 'instructor');

-- Enrollments RLS
CREATE POLICY "enrollments_student_own" ON public.enrollments FOR SELECT USING (student_id = auth.uid() OR public.is_admin() OR public.get_user_role() = 'employee');
CREATE POLICY "enrollments_student_insert" ON public.enrollments FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "enrollments_student_update" ON public.enrollments FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "enrollments_admin_all" ON public.enrollments FOR ALL USING (public.is_admin());

-- Coding Questions RLS
CREATE POLICY "coding_q_read_active" ON public.coding_questions FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "coding_q_admin_all"   ON public.coding_questions FOR ALL USING (public.is_admin());

-- Test Cases RLS (hide hidden test cases from students)
CREATE POLICY "test_cases_visible" ON public.coding_test_cases FOR SELECT USING (is_hidden = false OR public.is_admin());
CREATE POLICY "test_cases_admin"   ON public.coding_test_cases FOR ALL USING (public.is_admin());

-- MCQ Questions RLS
CREATE POLICY "mcq_q_read" ON public.mcq_questions FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "mcq_q_admin" ON public.mcq_questions FOR ALL USING (public.is_admin());

-- Tests RLS
CREATE POLICY "tests_read" ON public.tests FOR SELECT USING (status != 'draft' OR public.is_admin() OR public.get_user_role() = 'employee');
CREATE POLICY "tests_admin" ON public.tests FOR ALL USING (public.is_admin());

-- Submissions RLS
CREATE POLICY "coding_sub_own" ON public.coding_submissions FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "coding_sub_insert" ON public.coding_submissions FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "coding_sub_admin" ON public.coding_submissions FOR ALL USING (public.is_admin());

CREATE POLICY "mcq_sub_own"    ON public.mcq_submissions FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "mcq_sub_insert" ON public.mcq_submissions FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "mcq_sub_admin"  ON public.mcq_submissions FOR ALL USING (public.is_admin());

-- Results RLS
CREATE POLICY "results_own"   ON public.results FOR SELECT USING (student_id = auth.uid() OR public.is_admin() OR public.get_user_role() = 'employee');
CREATE POLICY "results_insert" ON public.results FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "results_admin" ON public.results FOR ALL USING (public.is_admin());

-- Certificates RLS
CREATE POLICY "certs_own"    ON public.certificates FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "certs_admin"  ON public.certificates FOR ALL USING (public.is_admin());

-- Anti-Cheat Logs RLS
CREATE POLICY "anti_cheat_own"   ON public.anti_cheat_logs FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "anti_cheat_insert" ON public.anti_cheat_logs FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "anti_cheat_admin" ON public.anti_cheat_logs FOR ALL USING (public.is_admin());

-- Face Monitor Logs RLS
CREATE POLICY "face_log_own"    ON public.face_monitor_logs FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "face_log_insert" ON public.face_monitor_logs FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "face_log_admin"  ON public.face_monitor_logs FOR ALL USING (public.is_admin());

-- Notifications RLS
CREATE POLICY "notif_own"    ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notif_admin"  ON public.notifications FOR ALL USING (public.is_admin());

-- Announcements RLS
CREATE POLICY "announce_read" ON public.announcements FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "announce_admin" ON public.announcements FOR ALL USING (public.is_admin());

-- Activity Logs RLS
CREATE POLICY "activity_own"   ON public.activity_logs FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "activity_insert" ON public.activity_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "activity_admin" ON public.activity_logs FOR ALL USING (public.is_admin());

-- Settings RLS
CREATE POLICY "settings_read"  ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings_admin" ON public.settings FOR ALL USING (public.is_admin());

-- Miscellaneous RLS (Default read-only for public, admin for everything else)
CREATE POLICY "categories_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin" ON public.categories FOR ALL USING (public.is_admin());

CREATE POLICY "payments_own" ON public.payments FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "payments_admin" ON public.payments FOR ALL USING (public.is_admin());

CREATE POLICY "reviews_read" ON public.course_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.course_reviews FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "reviews_admin" ON public.course_reviews FOR ALL USING (public.is_admin());

-- ============================================================
-- SUPABASE AUTH HOOK: Auto-create user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val public.user_role;
BEGIN
  user_role_val := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'student'
  );

  INSERT INTO public.users (id, email, full_name, avatar_url, role, is_email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    user_role_val,
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    is_email_verified = EXCLUDED.is_email_verified;

  -- Create student profile if role is student
  IF user_role_val = 'student' THEN
    INSERT INTO public.student_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Create employee profile if role is employee
  IF user_role_val = 'employee' THEN
    INSERT INTO public.employee_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger on auth email verification
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users SET is_email_verified = true WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_confirmed();
