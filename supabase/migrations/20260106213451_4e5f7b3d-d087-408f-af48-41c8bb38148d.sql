-- Add consent fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country text DEFAULT 'LT';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS marketing_opt_in boolean;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS marketing_opt_in_at timestamp with time zone;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS personalization_opt_in boolean;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS personalization_opt_in_at timestamp with time zone;

-- Create app_settings table for configurable system settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policies for app_settings
CREATE POLICY "Anyone can view app settings"
ON public.app_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage app settings"
ON public.app_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default credits settings
INSERT INTO public.app_settings (key, value, description) VALUES
('credits.earn_rate_percent', '{"value": 3}', 'Percentage of eligible purchase that becomes credits'),
('credits.min_order_subtotal_cents', '{"value": 1000}', 'Minimum order subtotal (cents) to earn credits'),
('credits.max_redeem_percent', '{"value": 50}', 'Maximum percentage of subtotal payable with credits'),
('credits.activation_delay_days', '{"value": 14}', 'Days until earned credits become available'),
('credits.exclude_categories', '{"value": ["gift_card"]}', 'Categories excluded from earning/redeeming credits')
ON CONFLICT (key) DO NOTHING;

-- Add credits fields to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS credits_earned_cents integer DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS credits_redeemed_cents integer DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS credits_status text DEFAULT 'none';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_amount_cents integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal_cents integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cents integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_cents integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_cents integer;

-- Alter wallet_transactions table to add new columns for ledger
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id);
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS reason text;

-- Create indexes for wallet_transactions ledger queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created ON public.wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order ON public.wallet_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type_status ON public.wallet_transactions(type, status);

-- Create trigger to update updated_at on app_settings
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();