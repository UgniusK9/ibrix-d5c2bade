-- Add badges column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb;

-- Create wishlists table
CREATE TABLE public.wishlists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS on wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Wishlist RLS policies
CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist"
  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own wishlist"
  ON public.wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for admin uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-uploads', 'admin-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for admin uploads
CREATE POLICY "Admins can upload to admin-uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'admin-uploads' 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update admin-uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'admin-uploads' 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete from admin-uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'admin-uploads' 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view admin-uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'admin-uploads');

-- Create index on wishlists
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON public.wishlists(product_id);