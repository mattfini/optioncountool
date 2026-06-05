-- Run in Supabase SQL Editor

-- Step 1: Add second floor layout image column
ALTER TABLE stores ADD COLUMN IF NOT EXISTS layout_image_url_2 text;

-- Step 2: Insert all stores
INSERT INTO stores (name, layout_image_url, layout_image_url_2) VALUES
('Bath',        'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/bath.png',        NULL),
('Brighton',    'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/brighton.png',    NULL),
('Bristol',     'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/bristol.png',     NULL),
('Cambridge',   'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/cambridge.png',   NULL),
('Cardiff',     'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/cardiff.png',     NULL),
('Edinburgh',   'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/edinburgh.png',   NULL),
('Exeter',      'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/exeter.png',      NULL),
('Falmouth',    'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/falmouth.png',    NULL),
('Hawksfield',  'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/hawksfield.png',  NULL),
('Holt',        'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/holt.png',        NULL),
('London',      'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/london-floor1.png',
                'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/london-floor2.png'),
('Poole',       'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/poole-floor1.png',
                'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/poole-floor2.png'),
('St Ives',     'https://toowjbgtnkggmgczolhm.supabase.co/storage/v1/object/public/store-layouts/st-ives.png',     NULL),
('Southwold',   NULL, NULL),
('Leeds',       NULL, NULL);
