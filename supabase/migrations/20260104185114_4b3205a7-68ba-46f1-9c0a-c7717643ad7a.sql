-- Add sale_price_eur field to products for discounts
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price_eur numeric DEFAULT NULL;

-- Create product reviews table
CREATE TABLE public.product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text,
  verified_purchase boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Enable RLS on product_reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for product_reviews
CREATE POLICY "Admins can manage all reviews"
ON public.product_reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view approved reviews"
ON public.product_reviews
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can create reviews for purchased products"
ON public.product_reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = auth.uid()
    AND oi.product_id = product_reviews.product_id
    AND o.status NOT IN ('cancelled', 'created')
  )
);

CREATE POLICY "Users can update own reviews"
ON public.product_reviews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
ON public.product_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX idx_product_reviews_status ON public.product_reviews(status);