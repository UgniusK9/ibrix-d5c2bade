-- Add credits_cost column to products table
-- This stores how many credits are needed to redeem the product for free
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS credits_cost_eur numeric DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.products.credits_cost_eur IS 'Credits cost in EUR to redeem this product for free. NULL means not redeemable with credits.';