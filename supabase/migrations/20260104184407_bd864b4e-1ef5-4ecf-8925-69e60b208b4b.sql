-- Create stock notifications table for out-of-stock alerts
CREATE TABLE public.stock_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (even anonymous)
CREATE POLICY "Anyone can create stock notifications"
  ON public.stock_notifications
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.stock_notifications
  FOR SELECT
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id) OR
    (user_id IS NULL AND email IS NOT NULL)
  );

-- Users can cancel their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.stock_notifications
  FOR DELETE
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
  );

-- Create index for efficient lookups
CREATE INDEX idx_stock_notifications_product ON public.stock_notifications(product_id);
CREATE INDEX idx_stock_notifications_email ON public.stock_notifications(email);

-- Add unique constraint to prevent duplicate subscriptions
CREATE UNIQUE INDEX idx_stock_notifications_unique 
  ON public.stock_notifications(product_id, email) 
  WHERE status = 'pending';