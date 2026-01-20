-- =====================================================
-- COMPREHENSIVE SECURITY FIX MIGRATION (Part 2)
-- Fixes remaining policies after partial success
-- =====================================================

-- =====================================================
-- 3. FIX orders - Block public access to guest orders
-- =====================================================

-- Drop existing policy first
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- Recreate admin policy
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 4. FIX sessions - Block public SELECT access
-- =====================================================

-- Drop any existing policies that might allow public access
DROP POLICY IF EXISTS "Anyone can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Public can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

-- Users can view only their own session (if they have one linked)
CREATE POLICY "Users can view own sessions"
ON public.sessions
FOR SELECT
USING (
  user_id IS NOT NULL 
  AND auth.uid() = user_id
);