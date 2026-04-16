-- 1. stock_notifications: remove guest email exposure
DROP POLICY IF EXISTS "Users can view own notifications" ON public.stock_notifications;
CREATE POLICY "Users can view own notifications"
  ON public.stock_notifications FOR SELECT
  USING (user_id IS NOT NULL AND auth.uid() = user_id);

-- 2. serial_numbers: remove public read; admins only (registration uses service role)
DROP POLICY IF EXISTS "Anyone can check serial exists" ON public.serial_numbers;

-- 3. inquiry_messages: allow admins SELECT (already exists). No public/user SELECT
-- to prevent broadcasting PII via Realtime. The user-facing inquiry thread is
-- read server-side via the get-inquiry-by-token edge function (service role).
-- Ensure no public SELECT policy exists.
DROP POLICY IF EXISTS "Public can view inquiry messages" ON public.inquiry_messages;

-- 4. Realtime PII: remove contact_inquiries and inquiry_messages from realtime
-- publication so PII change events are not broadcast to subscribers.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contact_inquiries'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.contact_inquiries';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'inquiry_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.inquiry_messages';
  END IF;
END $$;