-- SECURITY FIX: Remove plaintext password storage from email_verification_codes
-- The password_hash column stores PLAINTEXT passwords which is a critical security vulnerability

-- Step 1: Drop the password_hash column
ALTER TABLE public.email_verification_codes DROP COLUMN IF EXISTS password_hash;

-- Step 2: Add comment explaining the security fix
COMMENT ON TABLE public.email_verification_codes IS 'Stores email verification codes for signup. Password is collected at verification time, not stored here.';