-- =====================================================
-- MIGRATION: Complete E-commerce Enhancement
-- =====================================================

-- 1. ANALYTICS: Add UTM tracking fields to sessions
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_content text,
ADD COLUMN IF NOT EXISTS utm_term text,
ADD COLUMN IF NOT EXISTS gclid text,
ADD COLUMN IF NOT EXISTS fbclid text,
ADD COLUMN IF NOT EXISTS landing_page text;

-- 2. ANALYTICS: Add event_id to events for deduplication
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_id text,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'client';

-- Create index for deduplication lookups
CREATE INDEX IF NOT EXISTS idx_events_event_id ON public.events(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_name_created ON public.events(name, created_at DESC);

-- 3. OFFERS: Enhance offers table with coupon features
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS min_cart_total numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_redemptions integer,
ADD COLUMN IF NOT EXISTS per_user_limit integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS applicable_products jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS applicable_categories jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS stackable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS free_shipping boolean DEFAULT false;

-- 4. ORDERS: Add invoice details and UTM tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS wants_invoice boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS invoice_company_name text,
ADD COLUMN IF NOT EXISTS invoice_vat_code text,
ADD COLUMN IF NOT EXISTS invoice_address text,
ADD COLUMN IF NOT EXISTS invoice_country text DEFAULT 'LT',
ADD COLUMN IF NOT EXISTS invoice_number text,
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS gclid text,
ADD COLUMN IF NOT EXISTS fbclid text,
ADD COLUMN IF NOT EXISTS offer_code text,
ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES public.offers(id);

-- 5. REFUNDS: Create refunds table
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'processing', 'refunded')),
  reason text NOT NULL,
  customer_notes text,
  admin_notes text,
  amount_eur numeric NOT NULL,
  is_full_refund boolean DEFAULT false,
  stripe_refund_id text,
  requested_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on refunds
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Refunds policies
CREATE POLICY "Users can view own refunds" ON public.refunds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = refunds.order_id 
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create refund requests for own orders" ON public.refunds
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id 
      AND o.user_id = auth.uid()
      AND o.status NOT IN ('cancelled', 'refunded')
    )
  );

CREATE POLICY "Admins can view all refunds" ON public.refunds
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage refunds" ON public.refunds
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger for refunds
CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create index for order lookups with offers
CREATE INDEX IF NOT EXISTS idx_orders_offer_id ON public.orders(offer_id) WHERE offer_id IS NOT NULL;

-- 7. REDEMPTIONS: Add more fields for tracking
ALTER TABLE public.redemptions
ADD COLUMN IF NOT EXISTS discount_amount_eur numeric;

-- 8. Add public read access to active offers (for checkout validation)
-- (Already exists per context)

-- 9. Create invoice number generation function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ ('^INV-' || year_part || '-[0-9]+$')
      THEN CAST(SUBSTRING(invoice_number FROM 10) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO seq_num
  FROM public.orders
  WHERE invoice_number IS NOT NULL;
  
  new_number := 'INV-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;