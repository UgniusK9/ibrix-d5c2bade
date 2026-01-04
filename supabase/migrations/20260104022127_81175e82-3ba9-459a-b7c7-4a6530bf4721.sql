-- Gift Cards / Store Credit / Wallet System

-- Gift cards table
CREATE TABLE public.gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  initial_value_eur NUMERIC NOT NULL CHECK (initial_value_eur > 0),
  current_balance_eur NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  purchased_by_user_id UUID REFERENCES public.users(id),
  purchased_by_email TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  personal_message TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE,
  redeemed_by_user_id UUID REFERENCES public.users(id),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User wallet / store credit table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id),
  balance_eur NUMERIC NOT NULL DEFAULT 0 CHECK (balance_eur >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wallet transactions for audit trail
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'gift_card_redeem', 'purchase', 'admin_adjustment')),
  amount_eur NUMERIC NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bundle rules for discounts
CREATE TABLE public.bundle_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_product_id UUID REFERENCES public.products(id),
  trigger_category TEXT,
  trigger_min_qty INTEGER NOT NULL DEFAULT 1,
  discount_product_id UUID REFERENCES public.products(id),
  discount_category TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Balance request log for admin tracking
CREATE TABLE public.balance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  requested_by_user_id UUID REFERENCES public.users(id),
  message TEXT,
  payment_url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_requests ENABLE ROW LEVEL SECURITY;

-- Gift cards policies
CREATE POLICY "Users can view gift cards they purchased or received"
  ON public.gift_cards FOR SELECT
  USING (
    purchased_by_user_id = auth.uid() OR 
    redeemed_by_user_id = auth.uid()
  );

CREATE POLICY "Admins can view all gift cards"
  ON public.gift_cards FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage gift cards"
  ON public.gift_cards FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Wallet policies
CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all wallets"
  ON public.wallets FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage wallets"
  ON public.wallets FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Wallet transactions policies
CREATE POLICY "Users can view own wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.wallets 
    WHERE wallets.id = wallet_transactions.wallet_id 
    AND wallets.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage wallet transactions"
  ON public.wallet_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Bundle rules policies
CREATE POLICY "Anyone can view active bundle rules"
  ON public.bundle_rules FOR SELECT
  USING (active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));

CREATE POLICY "Admins can manage bundle rules"
  ON public.bundle_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Balance requests policies
CREATE POLICY "Admins can view all balance requests"
  ON public.balance_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create balance requests"
  ON public.balance_requests FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX idx_gift_cards_status ON public.gift_cards(status);
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_bundle_rules_active ON public.bundle_rules(active);
CREATE INDEX idx_balance_requests_order_id ON public.balance_requests(order_id);

-- Trigger for updated_at
CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bundle_rules_updated_at
  BEFORE UPDATE ON public.bundle_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique gift card codes
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate a code like IBGC-XXXX-XXXX where X is alphanumeric
    new_code := 'IBGC-' || 
      UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 4)) || '-' ||
      UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 4));
    
    SELECT COUNT(*) INTO exists_count FROM public.gift_cards WHERE code = new_code;
    
    IF exists_count = 0 THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;