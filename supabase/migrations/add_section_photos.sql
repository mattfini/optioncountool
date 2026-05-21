-- Run in Supabase SQL Editor to add section photo support

-- Add comment column if not present (may already exist)
ALTER TABLE submission_sections ADD COLUMN IF NOT EXISTS comment text;

-- Add photo_url column
ALTER TABLE submission_sections ADD COLUMN IF NOT EXISTS photo_url text;

-- Create public storage bucket for section photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('section-photos', 'section-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anon users to upload to the bucket
CREATE POLICY "anon_upload_section_photos" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'section-photos');

-- Allow anon users to read from the bucket
CREATE POLICY "anon_read_section_photos" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'section-photos');
