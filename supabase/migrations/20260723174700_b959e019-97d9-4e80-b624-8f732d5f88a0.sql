
-- 1) offers: remove public/anon read access; keep authenticated reads for cart UI, admins keep full access.
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.offers;
CREATE POLICY "Authenticated can view active offers" ON public.offers
  FOR SELECT TO authenticated
  USING (active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
REVOKE SELECT ON public.offers FROM anon;

-- 2) inquiry_messages: drop the wide-open insert policy. Inserts happen through the
-- add-inquiry-message edge function using service_role, which bypasses RLS.
DROP POLICY IF EXISTS "Anyone can add messages" ON public.inquiry_messages;

-- 3) users: prevent self role escalation by replacing the broad update policy.
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- 4) review-images storage: enforce first path segment = auth.uid()
DROP POLICY IF EXISTS "Authenticated users can upload review images" ON storage.objects;
CREATE POLICY "Users can upload own review images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'review-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 5) Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated.
-- Keep has_role (used inside RLS), check_username_available and get_public_collection (client-callable RPCs).
REVOKE EXECUTE ON FUNCTION public.generate_gift_card_code() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_verification_codes() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_username_lower() FROM anon, authenticated, PUBLIC;
