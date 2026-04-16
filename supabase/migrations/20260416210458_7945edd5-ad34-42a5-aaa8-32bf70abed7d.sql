-- ============================================
-- 1. PRODUCT VIEWS table
-- ============================================
CREATE TABLE public.product_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT,
  viewer_type TEXT NOT NULL DEFAULT 'guest' CHECK (viewer_type IN ('guest', 'authenticated')),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX idx_product_views_created_at ON public.product_views(created_at DESC);
CREATE INDEX idx_product_views_product_date ON public.product_views(product_id, created_at DESC);
CREATE INDEX idx_product_views_user_id ON public.product_views(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Anyone (guest or auth) can insert their own view
CREATE POLICY "Anyone can log product views"
ON public.product_views
FOR INSERT
WITH CHECK (true);

-- Only admins can read views
CREATE POLICY "Admins can view all product views"
ON public.product_views
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 2. CART RECOVERY LINKS table
-- ============================================
CREATE TABLE public.cart_recovery_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE NOT NULL,
  offer_code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  cart_id UUID REFERENCES public.carts(id) ON DELETE SET NULL,
  created_by_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  email_sent_at TIMESTAMPTZ,
  email_status TEXT DEFAULT 'pending' CHECK (email_status IN ('pending','sent','failed')),
  email_error TEXT,
  claimed_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  used_in_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cart_recovery_token ON public.cart_recovery_links(token);
CREATE INDEX idx_cart_recovery_user ON public.cart_recovery_links(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_cart_recovery_email ON public.cart_recovery_links(recipient_email);
CREATE INDEX idx_cart_recovery_expires ON public.cart_recovery_links(expires_at);

ALTER TABLE public.cart_recovery_links ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage cart recovery links"
ON public.cart_recovery_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own links
CREATE POLICY "Users view own cart recovery links"
ON public.cart_recovery_links
FOR SELECT
USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_cart_recovery_links_updated_at
BEFORE UPDATE ON public.cart_recovery_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();