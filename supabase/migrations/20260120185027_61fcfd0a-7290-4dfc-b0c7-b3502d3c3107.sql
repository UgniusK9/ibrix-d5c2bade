-- Add username column to email_verification_codes table
ALTER TABLE public.email_verification_codes
ADD COLUMN IF NOT EXISTS username text;