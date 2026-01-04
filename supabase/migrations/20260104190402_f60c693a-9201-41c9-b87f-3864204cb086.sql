-- Add tags column to products table for better related products recommendations
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create index for tags array for better query performance
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);