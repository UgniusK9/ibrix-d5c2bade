-- Fix RLS policies to protect guest orders from direct client access
-- Guest orders should ONLY be accessible via Edge Functions with tracking token validation

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can view own shipment events" ON public.shipment_events;

-- Create new policy for orders: Only allow authenticated users to see their OWN orders
-- Guest orders (user_id IS NULL) are NOT accessible via direct client queries
-- They must go through Edge Functions which use service_role key
CREATE POLICY "Authenticated users can view own orders" ON public.orders
  FOR SELECT
  USING (
    user_id IS NOT NULL AND auth.uid() = user_id
  );

-- Create new policy for order_items: Only items from authenticated user's orders
CREATE POLICY "Authenticated users can view own order items" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id IS NOT NULL
      AND orders.user_id = auth.uid()
    )
  );

-- Create new policy for shipments: Only shipments from authenticated user's orders
CREATE POLICY "Authenticated users can view own shipments" ON public.shipments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = shipments.order_id
      AND orders.user_id IS NOT NULL
      AND orders.user_id = auth.uid()
    )
  );

-- Create new policy for shipment_events: Only events from authenticated user's shipments
CREATE POLICY "Authenticated users can view own shipment events" ON public.shipment_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments
      JOIN public.orders ON orders.id = shipments.order_id
      WHERE shipments.id = shipment_events.shipment_id
      AND orders.user_id IS NOT NULL
      AND orders.user_id = auth.uid()
    )
  );