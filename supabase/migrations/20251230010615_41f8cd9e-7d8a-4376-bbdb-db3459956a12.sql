-- RLS policy for tracking_tokens - no direct access, only via edge function with service role
-- We don't need user-facing RLS since tokens are validated server-side
CREATE POLICY "No direct access to tracking tokens"
ON public.tracking_tokens
FOR SELECT
USING (false);

-- Service role can manage tokens via edge functions