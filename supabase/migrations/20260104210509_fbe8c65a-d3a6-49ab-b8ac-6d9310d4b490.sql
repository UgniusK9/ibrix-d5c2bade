-- Add image_url and admin_reply columns to product_reviews
ALTER TABLE public.product_reviews 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS admin_reply text,
ADD COLUMN IF NOT EXISTS admin_reply_at timestamp with time zone;

-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view review images
CREATE POLICY "Anyone can view review images"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

-- Allow authenticated users to upload review images
CREATE POLICY "Authenticated users can upload review images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-images' AND auth.role() = 'authenticated');

-- Allow users to delete their own review images
CREATE POLICY "Users can delete own review images"
ON storage.objects FOR DELETE
USING (bucket_id = 'review-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow admins to delete any review images
CREATE POLICY "Admins can manage review images"
ON storage.objects FOR ALL
USING (bucket_id = 'review-images' AND EXISTS (
  SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
));