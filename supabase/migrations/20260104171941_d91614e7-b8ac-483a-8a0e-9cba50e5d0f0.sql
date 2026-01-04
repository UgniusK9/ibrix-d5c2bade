-- Create promo_banners table for homepage promotional banners
CREATE TABLE public.promo_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  background_color TEXT DEFAULT '#1E4ED8',
  link_url TEXT NOT NULL DEFAULT '/produktai/visi',
  link_text TEXT DEFAULT 'Pirkti dabar',
  secondary_link_url TEXT,
  secondary_link_text TEXT,
  badge_text TEXT,
  badge_variant TEXT DEFAULT 'default',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active banners
CREATE POLICY "Public can view active promo banners"
  ON public.promo_banners
  FOR SELECT
  USING (active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));

-- Allow admins full access via users table check
CREATE POLICY "Admins can manage promo banners"
  ON public.promo_banners
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Index for sorting
CREATE INDEX idx_promo_banners_active_sort ON public.promo_banners(active, sort_order) WHERE active = true;

-- Create trigger for updated_at
CREATE TRIGGER update_promo_banners_updated_at
  BEFORE UPDATE ON public.promo_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();