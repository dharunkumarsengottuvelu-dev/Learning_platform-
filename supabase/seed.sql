-- ============================================================
-- Seed Data — Roles, Departments, and Super Admin
-- Run AFTER 001_schema.sql and 002_rls.sql
--
-- IMPORTANT: Create the super_admin user via Supabase Auth first
-- (Dashboard → Authentication → Users → Invite User)
-- then update the UUID below to match the created user's ID.
-- ============================================================

-- ─── Departments ──────────────────────────────────────────────────────────────
INSERT INTO departments (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Engineering', 'Software engineering teams'),
  ('22222222-2222-2222-2222-222222222222', 'Human Resources', 'HR and people operations'),
  ('33333333-3333-3333-3333-333333333333', 'Product Management', 'Product strategy and roadmap'),
  ('44444444-4444-4444-4444-444444444444', 'Sales & Marketing', 'Revenue generating teams'),
  ('55555555-5555-5555-5555-555555555555', 'Operations', 'Business operations')
ON CONFLICT (name) DO NOTHING;

-- ─── Batches ──────────────────────────────────────────────────────────────────
INSERT INTO batches (name, department_id, start_date, end_date) VALUES
  ('Batch 2024-A', '11111111-1111-1111-1111-111111111111', '2024-01-15', '2024-06-15'),
  ('Batch 2024-B', '11111111-1111-1111-1111-111111111111', '2024-07-01', '2024-12-31'),
  ('HR Onboarding Q1', '22222222-2222-2222-2222-222222222222', '2024-01-01', '2024-03-31')
ON CONFLICT DO NOTHING;

-- ─── Settings defaults ────────────────────────────────────────────────────────
INSERT INTO settings (key, value) VALUES
  ('site_name',           '"Training Compiler"'),
  ('allow_self_register', 'true'),
  ('certificate_enabled', 'true'),
  ('max_file_upload_mb',  '50'),
  ('smtp_enabled',        'false')
ON CONFLICT (key) DO NOTHING;

-- ─── NOTE: Super Admin user ───────────────────────────────────────────────────
-- After creating the user via Supabase Auth Dashboard or via signup,
-- update their role to super_admin:
--
-- UPDATE users SET role = 'super_admin' WHERE email = 'admin@yourcompany.com';
