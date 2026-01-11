-- Drop the restrictive RLS policy for INSERT
DROP POLICY IF EXISTS "Users can create reviews for purchased products" ON public.product_reviews;

-- Create a new policy that allows authenticated users to create reviews
-- (verified_purchase will be set based on actual purchase check)
CREATE POLICY "Authenticated users can create reviews" 
ON public.product_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add policy so users can view their own pending reviews
CREATE POLICY "Users can view own reviews" 
ON public.product_reviews 
FOR SELECT 
USING (auth.uid() = user_id);