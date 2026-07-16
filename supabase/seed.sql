-- ============================================================
-- Seed Data for Training Compiler
-- Run AFTER 003_techtrain_schema.sql
-- ============================================================

-- ─── Departments ──────────────────────────────────────────────────────────────
INSERT INTO departments (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Engineering', 'Software engineering teams'),
  ('22222222-2222-2222-2222-222222222222', 'Human Resources', 'HR and people operations')
ON CONFLICT (id) DO NOTHING;

-- ─── Batches ──────────────────────────────────────────────────────────────────
INSERT INTO batches (id, name, department_id, start_date, end_date) VALUES
  ('11111111-2222-3333-4444-555555555555', 'Batch 2024-A', '11111111-1111-1111-1111-111111111111', '2024-01-15', '2024-06-15')
ON CONFLICT (id) DO NOTHING;

-- ─── Note on Users ─────────────────────────────────────────────────────────────
-- Users must be created via Supabase Auth first. 
-- Assuming you have signed up as a user, you will get an auth.users record,
-- and the trigger will create a public.users record for you.
-- For this seed, we will create dummy test assignments without relying on a specific user.

-- ─── Courses ──────────────────────────────────────────────────────────────────
INSERT INTO courses (id, title, description, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Introduction to React', 'Learn the basics of React 19 and Next.js App Router.', 'published'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Advanced Algorithms', 'Master dynamic programming and graph algorithms.', 'published')
ON CONFLICT (id) DO NOTHING;

-- ─── Tests (MCQ) ─────────────────────────────────────────────────────────────
INSERT INTO tests (id, title, description, test_type, total_marks, pass_percentage, duration_minutes) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'React Fundamentals Quiz', 'Test your knowledge of React hooks and components.', 'mcq', 20, 50, 15)
ON CONFLICT (id) DO NOTHING;

-- ─── MCQ Questions ───────────────────────────────────────────────────────────
INSERT INTO mcq_questions (id, test_id, question_text, marks, difficulty, order_index) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Which hook is used for side effects in React?', 10, 'easy', 1),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'What does SSR stand for in Next.js?', 10, 'easy', 2)
ON CONFLICT (id) DO NOTHING;

-- ─── MCQ Options ─────────────────────────────────────────────────────────────
INSERT INTO mcq_options (id, question_id, option_text, is_correct) VALUES
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'useState', false),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'useEffect', true),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'useContext', false),
  (gen_random_uuid(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Server Side Rendering', true),
  (gen_random_uuid(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Static Site Rendering', false)
ON CONFLICT DO NOTHING;

-- ─── Coding Questions ────────────────────────────────────────────────────────
INSERT INTO coding_questions (id, title, description, difficulty, time_limit_ms, memory_limit_mb, starter_code) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Two Sum', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]', 'easy', 2000, 256, '{"python": "def two_sum(nums, target):\n    # Write your code here\n    pass", "javascript": "function twoSum(nums, target) {\n    // Write your code here\n}"}')
ON CONFLICT (id) DO NOTHING;

-- ─── Test Cases for Two Sum ──────────────────────────────────────────────────
INSERT INTO coding_test_cases (id, question_id, input_data, expected_output, is_hidden) VALUES
  (gen_random_uuid(), 'ffffffff-ffff-ffff-ffff-ffffffffffff', '[2,7,11,15]\n9', '[0, 1]', false),
  (gen_random_uuid(), 'ffffffff-ffff-ffff-ffff-ffffffffffff', '[3,2,4]\n6', '[1, 2]', false),
  (gen_random_uuid(), 'ffffffff-ffff-ffff-ffff-ffffffffffff', '[3,3]\n6', '[0, 1]', true)
ON CONFLICT DO NOTHING;
