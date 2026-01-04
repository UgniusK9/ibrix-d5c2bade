-- Create categories table for product categorization
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Anyone can view active categories" 
ON public.categories FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage categories" 
ON public.categories FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create newsletter_subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  first_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies for newsletter_subscribers
CREATE POLICY "Admins can manage newsletter subscribers" 
ON public.newsletter_subscribers FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage own subscription" 
ON public.newsletter_subscribers FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create newsletter_campaigns table
CREATE TABLE public.newsletter_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for newsletter_campaigns
CREATE POLICY "Admins can manage newsletter campaigns" 
ON public.newsletter_campaigns FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_status ON public.newsletter_subscribers(status);

-- Add category_id to products (nullable for now)
ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE INDEX idx_products_category_id ON public.products(category_id);

-- Trigger for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_newsletter_campaigns_updated_at
BEFORE UPDATE ON public.newsletter_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();