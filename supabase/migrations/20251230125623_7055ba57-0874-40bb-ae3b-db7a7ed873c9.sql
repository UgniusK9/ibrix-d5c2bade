-- Add last_accessed_at column to tracking_tokens for monitoring token usage patterns
ALTER TABLE public.tracking_tokens 
ADD COLUMN IF NOT EXISTS last_accessed_at timestamp with time zone DEFAULT NULL;