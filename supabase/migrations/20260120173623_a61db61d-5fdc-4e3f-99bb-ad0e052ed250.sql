-- =====================================================
-- FEATURE 1: Optional username for users
-- =====================================================

-- Add username columns to users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS username_lower text,
  ADD COLUMN IF NOT EXISTS collection_public boolean NOT NULL DEFAULT false;

-- Create partial unique index for case-insensitive username uniqueness (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower_unique 
  ON public.users (username_lower) 
  WHERE username_lower IS NOT NULL;

-- Create function to auto-populate username_lower on insert/update
CREATE OR REPLACE FUNCTION public.set_username_lower()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username IS NOT NULL THEN
    NEW.username_lower = LOWER(TRIM(NEW.username));
  ELSE
    NEW.username_lower = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for username normalization
DROP TRIGGER IF EXISTS tr_users_username_lower ON public.users;
CREATE TRIGGER tr_users_username_lower
  BEFORE INSERT OR UPDATE OF username ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_username_lower();

-- =====================================================
-- FEATURE 2: Serial numbers and user builders tables
-- =====================================================

-- Create serial_numbers table for tracking physical product serials
CREATE TABLE IF NOT EXISTS public.serial_numbers (
  serial text PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  issued_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'registered', 'voided'))
);

-- Enable RLS on serial_numbers
ALTER TABLE public.serial_numbers ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can manage serial numbers
CREATE POLICY "Admins can manage serial numbers"
  ON public.serial_numbers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Anyone can check if serial exists (for validation)
CREATE POLICY "Anyone can check serial exists"
  ON public.serial_numbers
  FOR SELECT
  USING (true);

-- Create user_builders table for tracking user's registered products
CREATE TABLE IF NOT EXISTS public.user_builders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('online', 'offline')),
  serial text REFERENCES public.serial_numbers(serial),
  order_id uuid REFERENCES public.orders(id),
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique constraint on serial (prevent double registration)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_builders_serial_unique
  ON public.user_builders (serial)
  WHERE serial IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_builders_user_id ON public.user_builders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_builders_product_id ON public.user_builders(product_id);

-- Enable RLS on user_builders
ALTER TABLE public.user_builders ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own builders
CREATE POLICY "Users can view own builders"
  ON public.user_builders
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: Users can insert for themselves only
CREATE POLICY "Users can insert own builders"
  ON public.user_builders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS: Users cannot update/delete their builders (only admin)
CREATE POLICY "Admins can manage all builders"
  ON public.user_builders
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FEATURE 3: Public collection search function
-- =====================================================

-- Create secure RPC function for public collection lookup by username
CREATE OR REPLACE FUNCTION public.get_public_collection(target_username text)
RETURNS TABLE (
  product_id uuid,
  product_title text,
  product_slug text,
  product_images jsonb,
  product_details_json jsonb,
  source text,
  quantity integer,
  created_at timestamp with time zone
) AS $$
DECLARE
  target_user_id uuid;
  is_public boolean;
BEGIN
  -- Find user by username (case-insensitive)
  SELECT id, collection_public INTO target_user_id, is_public
  FROM public.users
  WHERE username_lower = LOWER(TRIM(target_username));
  
  -- If user not found or collection is private, return empty
  IF target_user_id IS NULL OR NOT is_public THEN
    RETURN;
  END IF;
  
  -- Return the user's builders with product info
  RETURN QUERY
  SELECT 
    ub.product_id,
    p.title as product_title,
    p.slug as product_slug,
    p.images as product_images,
    p.details_json as product_details_json,
    ub.source,
    ub.quantity,
    ub.created_at
  FROM public.user_builders ub
  JOIN public.products p ON p.id = ub.product_id
  WHERE ub.user_id = target_user_id
  ORDER BY ub.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check username availability
CREATE OR REPLACE FUNCTION public.check_username_available(check_username text)
RETURNS boolean AS $$
BEGIN
  -- Validate format first (3-20 chars, letters, numbers, underscore, dot only)
  IF NOT (check_username ~ '^[a-zA-Z0-9_.]{3,20}$') THEN
    RETURN false;
  END IF;
  
  -- Check if username is taken
  RETURN NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE username_lower = LOWER(TRIM(check_username))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_public_collection(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated, anon;

-- =====================================================
-- Allow users to update their own username and collection_public
-- =====================================================

-- Drop existing update policy if it conflicts
DROP POLICY IF EXISTS "Users can update own username" ON public.users;

-- Create policy for users to update their own profile fields
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);