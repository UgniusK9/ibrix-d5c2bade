-- Create carrier enum
CREATE TYPE public.carrier_code AS ENUM ('omniva', 'lp_express', 'dpd', 'courier', 'other');

-- Create shipment status enum
CREATE TYPE public.shipment_status AS ENUM (
  'pending',
  'packed',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'exception'
);

-- Create shipment event source enum
CREATE TYPE public.event_source AS ENUM ('internal', 'carrier');

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier_code public.carrier_code NOT NULL,
  tracking_number TEXT,
  status public.shipment_status NOT NULL DEFAULT 'pending',
  packed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  last_carrier_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipment_events table
CREATE TABLE public.shipment_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  source public.event_source NOT NULL DEFAULT 'internal',
  status_code TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  carrier_event_id TEXT, -- For deduplication
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shipment_id, carrier_event_id)
);

-- Create tracking_tokens table
CREATE TABLE public.tracking_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add paid_at to orders if not exists
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipments (users can view their own)
CREATE POLICY "Users can view own shipments"
ON public.shipments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = shipments.order_id
  AND orders.user_id = auth.uid()
));

-- RLS policies for shipment_events (users can view their own via shipment)
CREATE POLICY "Users can view own shipment events"
ON public.shipment_events
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.shipments
  JOIN public.orders ON orders.id = shipments.order_id
  WHERE shipments.id = shipment_events.shipment_id
  AND orders.user_id = auth.uid()
));

-- Create indexes
CREATE INDEX idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON public.shipments(tracking_number);
CREATE INDEX idx_shipment_events_shipment_id ON public.shipment_events(shipment_id);
CREATE INDEX idx_shipment_events_occurred_at ON public.shipment_events(occurred_at DESC);
CREATE INDEX idx_tracking_tokens_token_hash ON public.tracking_tokens(token_hash);
CREATE INDEX idx_tracking_tokens_order_id ON public.tracking_tokens(order_id);

-- Trigger for updated_at on shipments
CREATE TRIGGER update_shipments_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();