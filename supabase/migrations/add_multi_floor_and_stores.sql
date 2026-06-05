-- Run in Supabase SQL Editor

-- Add second floor layout image column
ALTER TABLE stores ADD COLUMN IF NOT EXISTS layout_image_url_2 text;

-- Add stores (fill in the correct image URLs after uploading to Storage)
-- Single-floor stores: leave layout_image_url_2 as NULL
-- Two-floor stores (e.g. Poole, London): provide both URLs

-- Example — replace the URLs with your actual Supabase Storage URLs:
-- INSERT INTO stores (name, layout_image_url, layout_image_url_2) VALUES
--   ('Poole',   'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/store-layouts/poole-floor1.png',
--               'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/store-layouts/poole-floor2.png'),
--   ('London',  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/store-layouts/london-floor1.png',
--               'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/store-layouts/london-floor2.png'),
--   ('Bristol', 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/store-layouts/bristol.png', NULL);
