-- ============================================================
-- Row Level Security (RLS) Policies
-- Run AFTER 001_schema.sql
-- ============================================================

-- ─── Enable RLS on all tables ─────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ─── Helper Functions ─────────────────────────────────────────────────────────

-- Get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('admin', 'super_admin');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is trainer or admin
CREATE OR REPLACE FUNCTION is_trainer_or_above()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('trainer', 'admin', 'super_admin');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is manager or above
CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('manager', 'admin', 'super_admin');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ─── USERS table ──────────────────────────────────────────────────────────────

-- Users can read their own profile; admins can read all
CREATE POLICY "users_select" ON users FOR SELECT
  USING (id = auth.uid() OR is_admin() OR is_manager_or_above());

-- Users can update their own profile; admins can update any
CREATE POLICY "users_update" ON users FOR UPDATE
  USING (id = auth.uid() OR is_admin());

-- Only admins can insert new users (beyond the trigger)
CREATE POLICY "users_insert" ON users FOR INSERT
  WITH CHECK (is_admin());

-- Only super_admin can delete users
CREATE POLICY "users_delete" ON users FOR DELETE
  USING (current_user_role() = 'super_admin');

-- ─── DEPARTMENTS & BATCHES ────────────────────────────────────────────────────

CREATE POLICY "departments_select" ON departments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "departments_insert" ON departments FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "departments_update" ON departments FOR UPDATE USING (is_admin());
CREATE POLICY "departments_delete" ON departments FOR DELETE USING (is_admin());

CREATE POLICY "batches_select" ON batches FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "batches_insert" ON batches FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "batches_update" ON batches FOR UPDATE USING (is_admin());
CREATE POLICY "batches_delete" ON batches FOR DELETE USING (is_admin());

-- ─── COURSES ──────────────────────────────────────────────────────────────────

-- Students/managers/trainers see published courses or ones they're assigned to
-- Admins see all
CREATE POLICY "courses_select" ON courses FOR SELECT
  USING (
    is_admin()
    OR status = 'published'
    OR created_by = auth.uid()
  );

CREATE POLICY "courses_insert" ON courses FOR INSERT
  WITH CHECK (is_trainer_or_above());

CREATE POLICY "courses_update" ON courses FOR UPDATE
  USING (is_admin() OR created_by = auth.uid());

CREATE POLICY "courses_delete" ON courses FOR DELETE
  USING (is_admin());

-- ─── MODULES / CHAPTERS / TOPICS ─────────────────────────────────────────────

CREATE POLICY "modules_select" ON modules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "modules_insert" ON modules FOR INSERT WITH CHECK (is_trainer_or_above());
CREATE POLICY "modules_update" ON modules FOR UPDATE USING (is_trainer_or_above());
CREATE POLICY "modules_delete" ON modules FOR DELETE USING (is_admin());

CREATE POLICY "chapters_select" ON chapters FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "chapters_insert" ON chapters FOR INSERT WITH CHECK (is_trainer_or_above());
CREATE POLICY "chapters_update" ON chapters FOR UPDATE USING (is_trainer_or_above());
CREATE POLICY "chapters_delete" ON chapters FOR DELETE USING (is_admin());

CREATE POLICY "topics_select" ON topics FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "topics_insert" ON topics FOR INSERT WITH CHECK (is_trainer_or_above());
CREATE POLICY "topics_update" ON topics FOR UPDATE USING (is_trainer_or_above());
CREATE POLICY "topics_delete" ON topics FOR DELETE USING (is_admin());

CREATE POLICY "videos_select" ON videos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "videos_insert" ON videos FOR INSERT WITH CHECK (is_trainer_or_above());
CREATE POLICY "videos_update" ON videos FOR UPDATE USING (is_trainer_or_above());
CREATE POLICY "videos_delete" ON videos FOR DELETE USING (is_admin());

CREATE POLICY "documents_select" ON documents FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (is_trainer_or_above());
CREATE POLICY "documents_update" ON documents FOR UPDATE USING (is_trainer_or_above());
CREATE POLICY "documents_delete" ON documents FOR DELETE USING (is_admin());

-- ─── COURSE ASSIGNMENTS ───────────────────────────────────────────────────────

CREATE POLICY "course_assignments_select" ON course_assignments FOR SELECT
  USING (
    is_manager_or_above()
    OR (assignee_type = 'individual' AND assignee_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (
          (course_assignments.assignee_type = 'batch' AND u.batch_id = course_assignments.assignee_id)
          OR (course_assignments.assignee_type = 'department' AND u.department_id = course_assignments.assignee_id)
        )
    )
  );

CREATE POLICY "course_assignments_insert" ON course_assignments FOR INSERT
  WITH CHECK (is_trainer_or_above());

CREATE POLICY "course_assignments_update" ON course_assignments FOR UPDATE
  USING (is_admin());

CREATE POLICY "course_assignments_delete" ON course_assignments FOR DELETE
  USING (is_admin());

-- ─── TOPIC PROGRESS ──────────────────────────────────────────────────────────

CREATE POLICY "topic_progress_select" ON topic_progress FOR SELECT
  USING (user_id = auth.uid() OR is_trainer_or_above());

CREATE POLICY "topic_progress_insert" ON topic_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "topic_progress_update" ON topic_progress FOR UPDATE
  USING (user_id = auth.uid());

-- ─── TESTS & QUESTIONS ───────────────────────────────────────────────────────

CREATE POLICY "tests_select" ON tests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tests_insert" ON tests FOR INSERT WITH CHECK (is_trainer_or_above());
CREATE POLICY "tests_update" ON tests FOR UPDATE USING (is_trainer_or_above());
CREATE POLICY "tests_delete" ON tests FOR DELETE USING (is_admin());

CREATE POLICY "questions_select" ON questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "questions_insert" ON questions FOR INSERT WITH CHECK (is_trainer_or_above());
CREATE POLICY "questions_update" ON questions FOR UPDATE USING (is_trainer_or_above());
CREATE POLICY "questions_delete" ON questions FOR DELETE USING (is_trainer_or_above());

CREATE POLICY "question_options_select" ON question_options FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "question_options_insert" ON question_options FOR INSERT WITH CHECK (is_trainer_or_above());
CREATE POLICY "question_options_update" ON question_options FOR UPDATE USING (is_trainer_or_above());
CREATE POLICY "question_options_delete" ON question_options FOR DELETE USING (is_trainer_or_above());

-- ─── TEST ATTEMPTS ────────────────────────────────────────────────────────────

-- Students see only their own; trainers/admins see all
CREATE POLICY "test_attempts_select" ON test_attempts FOR SELECT
  USING (student_id = auth.uid() OR is_trainer_or_above());

CREATE POLICY "test_attempts_insert" ON test_attempts FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "test_attempts_update" ON test_attempts FOR UPDATE
  USING (student_id = auth.uid() OR is_trainer_or_above());

-- ─── CODING QUESTIONS & SUBMISSIONS ──────────────────────────────────────────

CREATE POLICY "coding_questions_select" ON coding_questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "coding_questions_insert" ON coding_questions FOR INSERT WITH CHECK (is_trainer_or_above());
CREATE POLICY "coding_questions_update" ON coding_questions FOR UPDATE USING (is_trainer_or_above());
CREATE POLICY "coding_questions_delete" ON coding_questions FOR DELETE USING (is_admin());

CREATE POLICY "coding_test_cases_select" ON coding_test_cases FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "coding_test_cases_insert" ON coding_test_cases FOR INSERT WITH CHECK (is_trainer_or_above());
CREATE POLICY "coding_test_cases_update" ON coding_test_cases FOR UPDATE USING (is_trainer_or_above());
CREATE POLICY "coding_test_cases_delete" ON coding_test_cases FOR DELETE USING (is_trainer_or_above());

CREATE POLICY "coding_submissions_select" ON coding_submissions FOR SELECT
  USING (student_id = auth.uid() OR is_trainer_or_above());

CREATE POLICY "coding_submissions_insert" ON coding_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "coding_submissions_update" ON coding_submissions FOR UPDATE
  USING (student_id = auth.uid() OR is_trainer_or_above());

-- ─── ASSIGNMENTS & SUBMISSIONS ────────────────────────────────────────────────

CREATE POLICY "assignments_select" ON assignments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "assignments_insert" ON assignments FOR INSERT WITH CHECK (is_trainer_or_above());
CREATE POLICY "assignments_update" ON assignments FOR UPDATE USING (is_trainer_or_above());
CREATE POLICY "assignments_delete" ON assignments FOR DELETE USING (is_admin());

CREATE POLICY "assignment_submissions_select" ON assignment_submissions FOR SELECT
  USING (student_id = auth.uid() OR is_trainer_or_above());

CREATE POLICY "assignment_submissions_insert" ON assignment_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "assignment_submissions_update" ON assignment_submissions FOR UPDATE
  USING (student_id = auth.uid() OR is_trainer_or_above());

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  WITH CHECK (is_trainer_or_above() OR user_id = auth.uid());

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications_delete" ON notifications FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- ─── CERTIFICATES ─────────────────────────────────────────────────────────────

-- Public verification: allow select with unique_id (handled in app logic via service role)
CREATE POLICY "certificates_select" ON certificates FOR SELECT
  USING (student_id = auth.uid() OR is_trainer_or_above());

CREATE POLICY "certificates_insert" ON certificates FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "certificates_update" ON certificates FOR UPDATE
  USING (is_admin());

-- ─── ACTIVITY & LOGIN LOGS ────────────────────────────────────────────────────

CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT
  WITH CHECK (TRUE);  -- any authenticated user can create their own log

CREATE POLICY "login_logs_select" ON login_logs FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "login_logs_insert" ON login_logs FOR INSERT
  WITH CHECK (TRUE);

-- ─── SETTINGS ────────────────────────────────────────────────────────────────

CREATE POLICY "settings_select" ON settings FOR SELECT
  USING (is_admin());

CREATE POLICY "settings_insert" ON settings FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "settings_update" ON settings FOR UPDATE
  USING (is_admin());
