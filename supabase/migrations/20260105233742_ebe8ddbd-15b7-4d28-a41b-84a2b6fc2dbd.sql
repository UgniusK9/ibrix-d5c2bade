-- Add payment provider tracking columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS payment_method_code text DEFAULT 'card';

-- Add comment for documentation
COMMENT ON COLUMN public.orders.payment_provider IS 'Payment provider: stripe, paypal, or paysera';
COMMENT ON COLUMN public.orders.payment_method_code IS 'Specific payment method code used';