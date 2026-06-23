-- Run in Supabase SQL Editor

-- 1. Add season columns to fixture_ideals
ALTER TABLE fixture_ideals ADD COLUMN IF NOT EXISTS ss_ideal numeric;
ALTER TABLE fixture_ideals ADD COLUMN IF NOT EXISTS aw_ideal numeric;

-- 2. Make ideal_options nullable (was NOT NULL)
ALTER TABLE fixture_ideals ALTER COLUMN ideal_options DROP NOT NULL;

-- 3. Add season to submissions (defaults to SS for existing records)
ALTER TABLE option_count_submissions ADD COLUMN IF NOT EXISTS season text DEFAULT 'SS';

-- 4. Replace all fixture ideals with new SS/AW season data
TRUNCATE fixture_ideals;

INSERT INTO fixture_ideals (fixture_name, department, ss_ideal, aw_ideal) VALUES
-- Wall fixtures - Mens
('2000 Wardrobe Rail with FF',  'Mens', 10, 8),
('1500 Wardrobe Rail with FF',  'Mens',  7, 5),
('1501 Wardrobe Rail No FF',    'Mens', 10, 8),
('1400 Wardrobe Rail',          'Mens',  8, 6),
('1200 Wardrobe Rail',          'Mens',  7, 5),
('1000 Wardrobe Rail',          'Mens',  5, 4),
('750 Side Rail',               'Mens',  4, 3),
('750 Front Arm',               'Mens',  2, 1),
('2000 Shelves',                'Mens',  2, 1),
('1500 Shelves',                'Mens',  3, 2),
('1200 Shelves',                'Mens',  3, 2),
('1000 Shelves',                'Mens',  2, 1),
-- Wall fixtures - Womens
('2000 Wardrobe Rail with FF',  'Womens', 10, 8),
('1500 Wardrobe Rail with FF',  'Womens',  7, 5),
('1501 Wardrobe Rail No FF',    'Womens', 10, 8),
('1400 Wardrobe Rail',          'Womens',  8, 6),
('1200 Wardrobe Rail',          'Womens',  7, 5),
('1000 Wardrobe Rail',          'Womens',  5, 4),
('750 Side Rail',               'Womens',  4, 3),
('750 Front Arm',               'Womens',  2, 1),
('2000 Shelves',                'Womens',  2, 1),
('1500 Shelves',                'Womens',  3, 2),
('1200 Shelves',                'Womens',  3, 2),
('1000 Shelves',                'Womens',  2, 1),
-- Floor fixtures - Mens
('750 Shelves',                 'Mens',  1, 1),
('2000 Floor Rail with FF',     'Mens',  9, 7),
('1800 Floor Rail with FF',     'Mens',  9, 7),
('1500 Floor Rail (no FF)',      'Mens', 10, 8),
('1500 Floor Rail (with FF)',    'Mens',  8, 6),
('1100 Floor Rail',             'Mens',  7, 5),
('Table 2000/900',              'Mens',  7, 5),
('Table 2000/700',              'Mens',  4, 3),
('Table 1700/900',              'Mens',  6, 4),
('Table 1700/700',              'Mens',  5, 3),
('Table 1500/900',              'Mens',  5, 3),
('Table 1200/900',              'Mens',  3, 2),
('Table 1500/700',              'Mens',  4, 3),
('2600 Bench',                  'Mens',  6, 4),
('1800 Bench',                  'Mens',  3, 2),
('1200/450 Bench',              'Mens',  2, 2),
('1500 Storage Box / Bench',    'Mens',  3, 2),
('1000 Storage Box / Bench',    'Mens',  2, 2),
('750 Storage Box',             'Mens',  1, 1),
('600 Storage Box',             'Mens',  1, 1),
-- Floor fixtures - Womens
('750 Shelves',                 'Womens',  1, 1),
('2000 Floor Rail with FF',     'Womens',  9, 7),
('1800 Floor Rail with FF',     'Womens',  9, 7),
('1500 Floor Rail (no FF)',      'Womens', 10, 8),
('1500 Floor Rail (with FF)',    'Womens',  8, 6),
('1100 Floor Rail',             'Womens',  7, 5),
('Table 2000/900',              'Womens',  7, 5),
('Table 2000/700',              'Womens',  4, 3),
('Table 1700/900',              'Womens',  6, 4),
('Table 1700/700',              'Womens',  5, 3),
('Table 1500/900',              'Womens',  5, 3),
('Table 1200/900',              'Womens',  3, 2),
('Table 1500/700',              'Womens',  4, 3),
('2600 Bench',                  'Womens',  6, 4),
('1800 Bench',                  'Womens',  3, 2),
('1200/450 Bench',              'Womens',  2, 2),
('1500 Storage Box / Bench',    'Womens',  3, 2),
('1000 Storage Box / Bench',    'Womens',  2, 2),
('750 Storage Box',             'Womens',  1, 1),
('600 Storage Box',             'Womens',  1, 1),
-- Accessories / Third Party fixtures
('1000 Shelf',  'Accessories',  4, 4),
('500 Shelf',   'Accessories',  2, 2),
('Peg',         'Accessories',  1, 2),
('1000 Shelf',  'Third Party',  4, 4),
('500 Shelf',   'Third Party',  2, 2),
('Peg',         'Third Party',  1, 2);
