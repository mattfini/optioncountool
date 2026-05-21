-- Run this in Supabase SQL Editor before running seed.sql

CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  layout_image_url text
);

CREATE TABLE IF NOT EXISTS fixture_ideals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_name text NOT NULL,
  department text NOT NULL,
  ideal_options numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS option_count_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id),
  submitted_by text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  status text DEFAULT 'submitted'
);

CREATE TABLE IF NOT EXISTS submission_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES option_count_submissions(id),
  section_number int NOT NULL,
  section_label text NOT NULL
);

CREATE TABLE IF NOT EXISTS submission_fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES submission_sections(id),
  fixture_name text,
  department text,
  quantity numeric,
  actual_options_per_fixture int,
  ideal_options_per_fixture numeric,
  ideal_total numeric,
  actual_total numeric
);

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixture_ideals ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_count_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_fixtures ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write for all tables
CREATE POLICY "anon_select" ON stores FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select" ON fixture_ideals FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select" ON option_count_submissions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON option_count_submissions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select" ON submission_sections FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON submission_sections FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select" ON submission_fixtures FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON submission_fixtures FOR INSERT TO anon WITH CHECK (true);
