-- Add cost_price_eur column to products table for profit calculation
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cost_price_eur NUMERIC DEFAULT NULL;

COMMENT ON COLUMN public.products.cost_price_eur IS 'Cost price for profit margin calculation (admin only)';