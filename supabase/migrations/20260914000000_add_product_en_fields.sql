-- Add English variants for product title / descriptions.
-- LT columns (title, short_desc, description) remain the source of truth;
-- *_en columns are shown when UI language is English, with fallback to LT.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS short_desc_en text,
  ADD COLUMN IF NOT EXISTS description_en text;
