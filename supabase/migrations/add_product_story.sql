-- Run in Supabase SQL Editor

ALTER TABLE submission_fixtures ADD COLUMN IF NOT EXISTS product_story text;
