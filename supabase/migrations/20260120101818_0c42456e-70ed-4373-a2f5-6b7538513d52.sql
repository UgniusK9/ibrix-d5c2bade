-- =====================================================
-- SECURITY FIX: Contact Inquiry Data Exposure
-- Add proper RLS SELECT policies to prevent unauthorized access
-- =====================================================

-- Drop any existing SELECT policies that might be overly permissive
DROP POLICY IF EXISTS "Anyone can view inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Public can view inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Users can view inquiries" ON public.contact_inquiries;

-- contact_inquiries: Only admins can SELECT
-- Public token-based access is handled via edge function (get-inquiry-by-token)
CREATE POLICY "Admins can view all inquiries"
ON public.contact_inquiries FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Drop any existing SELECT policies on inquiry_messages that are too permissive
DROP POLICY IF EXISTS "Anyone can view messages" ON public.inquiry_messages;
DROP POLICY IF EXISTS "Public can view messages" ON public.inquiry_messages;
DROP POLICY IF EXISTS "Users can view messages with valid inquiry access" ON public.inquiry_messages;

-- inquiry_messages: Only admins can SELECT
-- Public token-based access is handled via edge function (get-inquiry-by-token)
CREATE POLICY "Admins can view all inquiry messages"
ON public.inquiry_messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));