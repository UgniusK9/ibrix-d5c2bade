-- Product variants table for sizes, colors with inventory tracking
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Raudonas / L"
  sku_suffix TEXT NOT NULL, -- appended to product SKU
  option_type TEXT NOT NULL, -- 'size', 'color', 'other'
  option_value TEXT NOT NULL, -- e.g., "L", "Raudonas"
  price_adjustment_eur NUMERIC DEFAULT 0, -- +/- from base price
  inventory_qty INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active product variants"
ON public.product_variants
FOR SELECT
USING (status = 'active');

CREATE POLICY "Admins can manage product variants"
ON public.product_variants
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);

-- Trigger for updated_at
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();