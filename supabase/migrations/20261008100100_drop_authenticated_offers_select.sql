-- Any logged-in user could list every active discount code through the API.
-- Nothing in src/ reads `offers` directly; checkout, validate-discount and
-- send-cart-recovery use the service role, and the admin screen goes through the
-- `admin` edge function. Admin policies ("Admins can view all offers" /
-- "Admins can manage offers") are left in place.
DROP POLICY IF EXISTS "Authenticated can view active offers" ON public.offers;
REVOKE SELECT ON public.offers FROM authenticated;
