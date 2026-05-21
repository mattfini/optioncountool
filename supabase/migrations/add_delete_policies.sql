-- Run in Supabase SQL Editor to enable deletion of submissions

CREATE POLICY "anon_delete" ON option_count_submissions FOR DELETE TO anon USING (true);
CREATE POLICY "anon_delete" ON submission_sections FOR DELETE TO anon USING (true);
CREATE POLICY "anon_delete" ON submission_fixtures FOR DELETE TO anon USING (true);

-- Allow anon to delete photos from storage
CREATE POLICY "anon_delete_section_photos" ON storage.objects
FOR DELETE TO anon
USING (bucket_id = 'section-photos');
