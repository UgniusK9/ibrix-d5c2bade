-- Table to store email verification codes
CREATE TABLE public.email_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  password_hash TEXT NOT NULL,
  country TEXT,
  date_of_birth DATE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_email_verification_email ON public.email_verification_codes(email);
CREATE INDEX idx_email_verification_code ON public.email_verification_codes(code);

-- Auto-delete old codes after 24 hours
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.email_verification_codes
  WHERE expires_at < now() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_verification_codes_trigger
  AFTER INSERT ON public.email_verification_codes
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_verification_codes();

-- RLS: No direct access from frontend (edge function only)
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- No policies = no frontend access, only service role can access