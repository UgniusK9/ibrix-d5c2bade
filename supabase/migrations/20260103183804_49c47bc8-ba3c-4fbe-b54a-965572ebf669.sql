-- =============================================
-- IBRIX E-COMMERCE SCHEMA v2 (Deposit-based)
-- =============================================

-- 1. DROP existing tables (clean start)
DROP TABLE IF EXISTS public.shipment_events CASCADE;
DROP TABLE IF EXISTS public.shipments CASCADE;
DROP TABLE IF EXISTS public.tracking_tokens CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.carts CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.product_status CASCADE;
DROP TYPE IF EXISTS public.shipment_status CASCADE;
DROP TYPE IF EXISTS public.carrier_code CASCADE;
DROP TYPE IF EXISTS public.event_source CASCADE;
DROP TYPE IF EXISTS public.shipping_method CASCADE;
DROP TYPE IF EXISTS public.cart_item_type CASCADE;

-- =============================================
-- 2. CREATE NEW ENUMS
-- =============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.product_category AS ENUM ('engines', 'cars', 'flowers', 'other');
CREATE TYPE public.product_status AS ENUM ('active', 'inactive');
CREATE TYPE public.stock_status AS ENUM ('preorder', 'in_stock', 'out_of_stock');
CREATE TYPE public.order_status AS ENUM (
  'created', 
  'deposit_paid', 
  'awaiting_balance', 
  'balance_paid', 
  'packed', 
  'shipped', 
  'delivered', 
  'cancelled', 
  'refunded'
);
CREATE TYPE public.payment_plan AS ENUM ('deposit_only', 'full_payment');
CREATE TYPE public.payment_type AS ENUM ('deposit', 'balance', 'refund');
CREATE TYPE public.payment_status AS ENUM ('pending', 'succeeded', 'failed');
CREATE TYPE public.shipment_status AS ENUM ('pending', 'packed', 'shipped', 'in_transit', 'delivered');
CREATE TYPE public.carrier_code AS ENUM ('omniva', 'lp_express', 'dpd', 'other');
CREATE TYPE public.event_source AS ENUM ('internal', 'carrier');
CREATE TYPE public.offer_type AS ENUM ('percent', 'fixed');
CREATE TYPE public.segment_key AS ENUM ('CART_ABANDONER', 'HIGH_INTENT', 'RETURNING', 'NEW_USER');

-- =============================================
-- 3. CREATE TABLES
-- =============================================

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'customer',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions (anonymous + authenticated tracking)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  anonymous_id TEXT NOT NULL,
  user_agent TEXT,
  ip_hash TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_anonymous_id ON public.sessions(anonymous_id);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_desc TEXT,
  description TEXT,
  category public.product_category NOT NULL DEFAULT 'other',
  status public.product_status NOT NULL DEFAULT 'active',
  stock_status public.stock_status NOT NULL DEFAULT 'preorder',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_eur DECIMAL(10,2) NOT NULL,
  deposit_eur DECIMAL(10,2) NOT NULL,
  preorder_eta_weeks_min INT,
  preorder_eta_weeks_max INT,
  inventory_qty INT DEFAULT 0,
  details_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_stock_status ON public.products(stock_status);

-- Carts
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  anonymous_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_carts_user_id ON public.carts(user_id);
CREATE INDEX idx_carts_anonymous_id ON public.carts(anonymous_id);

-- Cart Items
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  phone TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status public.order_status NOT NULL DEFAULT 'created',
  payment_plan public.payment_plan NOT NULL DEFAULT 'deposit_only',
  preorder_flag BOOLEAN NOT NULL DEFAULT false,
  preorder_eta_weeks_min INT,
  preorder_eta_weeks_max INT,
  subtotal_eur DECIMAL(10,2) NOT NULL,
  discount_eur DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_eur DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_eur DECIMAL(10,2) NOT NULL,
  deposit_total_eur DECIMAL(10,2) NOT NULL,
  balance_total_eur DECIMAL(10,2) NOT NULL,
  shipping_address_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  balance_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_email ON public.orders(email);

-- Order Items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  sku_snapshot TEXT NOT NULL,
  title_snapshot TEXT NOT NULL,
  category_snapshot public.product_category NOT NULL,
  unit_price_eur DECIMAL(10,2) NOT NULL,
  unit_deposit_eur DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- Payments (audit trail for deposit/balance/refunds)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  type public.payment_type NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  amount_eur DECIMAL(10,2) NOT NULL,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_stripe_session ON public.payments(stripe_checkout_session_id);

-- Shipments
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier_code public.carrier_code,
  tracking_number TEXT,
  tracking_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status public.shipment_status NOT NULL DEFAULT 'pending',
  packed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX idx_shipments_tracking_token ON public.shipments(tracking_token);

-- Shipment Events
CREATE TABLE public.shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  source public.event_source NOT NULL DEFAULT 'internal',
  status_code TEXT NOT NULL,
  description TEXT NOT NULL,
  location_label TEXT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  carrier_event_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_shipment_events_shipment_id ON public.shipment_events(shipment_id);

-- Offers (discounts)
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type public.offer_type NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  code TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_offers_code ON public.offers(code);
CREATE INDEX idx_offers_active ON public.offers(active);

-- Offer Targets (user/segment targeting)
CREATE TABLE public.offer_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  segment_key public.segment_key,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_offer_targets_offer_id ON public.offer_targets(offer_id);
CREATE INDEX idx_offer_targets_user_id ON public.offer_targets(user_id);

-- Redemptions
CREATE TABLE public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_redemptions_offer_id ON public.redemptions(offer_id);
CREATE INDEX idx_redemptions_user_id ON public.redemptions(user_id);

-- Events (first-party analytics)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_session_id ON public.events(session_id);
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_name ON public.events(name);
CREATE INDEX idx_events_created_at ON public.events(created_at);

-- =============================================
-- 4. SECURITY DEFINER FUNCTIONS
-- =============================================

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- Generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  seq_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.orders;
  
  new_number := 'IBX-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN new_number;
END;
$$;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- 5. TRIGGERS
-- =============================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 6. ENABLE RLS
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. RLS POLICIES
-- =============================================

-- USERS
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage users"
  ON public.users FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SESSIONS (admin only, edge functions use service role)
CREATE POLICY "Admins can view sessions"
  ON public.sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- PRODUCTS (public read, admin write)
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CARTS
CREATE POLICY "Users can view own carts"
  ON public.carts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own carts"
  ON public.carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own carts"
  ON public.carts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own carts"
  ON public.carts FOR DELETE
  USING (auth.uid() = user_id);

-- CART ITEMS
CREATE POLICY "Users can view own cart items"
  ON public.cart_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.carts
    WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own cart items"
  ON public.cart_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.carts
    WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.carts
    WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
  ));

-- ORDERS
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage orders"
  ON public.orders FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ORDER ITEMS
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage order items"
  ON public.order_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PAYMENTS
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage payments"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SHIPMENTS
CREATE POLICY "Users can view own shipments"
  ON public.shipments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = shipments.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all shipments"
  ON public.shipments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage shipments"
  ON public.shipments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SHIPMENT EVENTS
CREATE POLICY "Users can view own shipment events"
  ON public.shipment_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shipments
    JOIN public.orders ON orders.id = shipments.order_id
    WHERE shipments.id = shipment_events.shipment_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all shipment events"
  ON public.shipment_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage shipment events"
  ON public.shipment_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- OFFERS (public read active, admin write)
CREATE POLICY "Anyone can view active offers"
  ON public.offers FOR SELECT
  USING (active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));

CREATE POLICY "Admins can view all offers"
  ON public.offers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage offers"
  ON public.offers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- OFFER TARGETS
CREATE POLICY "Users can view own offer targets"
  ON public.offer_targets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage offer targets"
  ON public.offer_targets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- REDEMPTIONS
CREATE POLICY "Users can view own redemptions"
  ON public.redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemptions"
  ON public.redemptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage redemptions"
  ON public.redemptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- EVENTS (admin only via RLS, edge functions use service role)
CREATE POLICY "Admins can view all events"
  ON public.events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 8. HANDLE NEW USER TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = current_setting('app.admin_email', true) THEN 'admin'::public.app_role
      ELSE 'customer'::public.app_role
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();