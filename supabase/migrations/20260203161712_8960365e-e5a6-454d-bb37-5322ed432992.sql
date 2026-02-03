-- Server-side rate limit for email change verification sends
-- Creates a per-user timestamp row to block repeated sends within 20 seconds.

CREATE TABLE IF NOT EXISTS public.email_change_requests (
  user_id uuid PRIMARY KEY,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_change_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own rate-limit row
CREATE POLICY "Users can view own email change requests"
ON public.email_change_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own rate-limit row
CREATE POLICY "Users can insert own email change requests"
ON public.email_change_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own rate-limit row
CREATE POLICY "Users can update own email change requests"
ON public.email_change_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- Keep updated_at current
DROP TRIGGER IF EXISTS update_email_change_requests_updated_at ON public.email_change_requests;
CREATE TRIGGER update_email_change_requests_updated_at
BEFORE UPDATE ON public.email_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_email_change_requests_last_sent_at ON public.email_change_requests (last_sent_at DESC);