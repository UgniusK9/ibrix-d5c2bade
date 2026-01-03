-- Add stripe_event_id to payments for idempotency tracking
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;

-- Create unique index on stripe_event_id (null values are ignored)
CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_event_id_unique 
ON public.payments (stripe_event_id) 
WHERE stripe_event_id IS NOT NULL;

-- Create webhook_events table for full idempotency tracking
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payload_summary JSONB,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook events
CREATE POLICY "Admins can view webhook events" 
ON public.webhook_events 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS webhook_events_stripe_event_id_idx ON public.webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS webhook_events_order_id_idx ON public.webhook_events(order_id);