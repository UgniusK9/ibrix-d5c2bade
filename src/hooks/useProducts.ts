import i18n from '@/i18n/config';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  short_desc: string | null;
  short_desc_en: string | null;
  price_eur: number;
  deposit_eur: number;
  sale_price_eur: number | null;
  sku: string;
  stock_status: 'preorder' | 'in_stock' | 'out_of_stock';
  status: 'active' | 'inactive';
  category: string;
  category_id: string | null;
  images: string[];
  badges: string[];
  tags: string[];
  inventory_qty: number | null;
  preorder_eta_weeks_min: number | null;
  preorder_eta_weeks_max: number | null;
  details_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Returns true when the UI should show English product copy.
// LT columns remain the source of truth; *_en is used with fallback to LT.
export function isEnglishLocale(lang?: string): boolean {
  const l = lang ?? (typeof i18n.language === 'string' ? i18n.language : 'lt');
  return l.toLowerCase().startsWith('en');
}

function pickLocalized(lt: string | null | undefined, en: string | null | undefined, lang?: string): string | null {
  if (isEnglishLocale(lang) && en && en.trim().length > 0) return en;
  return lt ?? null;
}

export function getProductTitle(product: Pick<Product, 'title' | 'title_en'>, lang?: string): string {
  return pickLocalized(product.title, product.title_en, lang) ?? product.title;
}

export function getProductShortDesc(product: Pick<Product, 'short_desc' | 'short_desc_en'>, lang?: string): string | null {
  return pickLocalized(product.short_desc, product.short_desc_en, lang);
}

export function getProductDescription(product: Pick<Product, 'description' | 'description_en'>, lang?: string): string | null {
  return pickLocalized(product.description, product.description_en, lang);
}

// Convenience: localized title + descriptions in one object (with LT fallback).
export function getLocalizedProduct<T extends Pick<Product, 'title' | 'title_en' | 'short_desc' | 'short_desc_en' | 'description' | 'description_en'>>(
  product: T,
  lang?: string,
): { title: string; short_desc: string | null; description: string | null } {
  return {
    title: getProductTitle(product, lang),
    short_desc: getProductShortDesc(product, lang),
    description: getProductDescription(product, lang),
  };
}

// Transform DB product to our Product interface
export function transformProduct(dbProduct: Record<string, unknown>): Product {
  const images = dbProduct.images as unknown;
  let imageArray: string[] = [];
  
  if (Array.isArray(images)) {
    imageArray = images as string[];
  } else if (typeof images === 'string') {
    try {
      imageArray = JSON.parse(images);
    } catch {
      imageArray = [images];
    }
  }

  const badges = dbProduct.badges as unknown;
  let badgeArray: string[] = [];
  
  if (Array.isArray(badges)) {
    badgeArray = badges as string[];
  } else if (typeof badges === 'string') {
    try {
      badgeArray = JSON.parse(badges);
    } catch {
      badgeArray = [];
    }
  }

  const tags = dbProduct.tags as unknown;
  const tagArray: string[] = Array.isArray(tags) ? tags as string[] : [];

  return {
    id: dbProduct.id as string,
    slug: dbProduct.slug as string,
    title: dbProduct.title as string,
    title_en: (dbProduct.title_en as string | null) ?? null,
    description: dbProduct.description as string | null,
    description_en: (dbProduct.description_en as string | null) ?? null,
    short_desc: dbProduct.short_desc as string | null,
    short_desc_en: (dbProduct.short_desc_en as string | null) ?? null,
    price_eur: Number(dbProduct.price_eur),
    deposit_eur: Number(dbProduct.deposit_eur),
    sale_price_eur: dbProduct.sale_price_eur ? Number(dbProduct.sale_price_eur) : null,
    sku: dbProduct.sku as string,
    stock_status: dbProduct.stock_status as 'preorder' | 'in_stock' | 'out_of_stock',
    status: dbProduct.status as 'active' | 'inactive',
    category: dbProduct.category as string,
    category_id: dbProduct.category_id as string | null,
    images: imageArray,
    badges: badgeArray,
    tags: tagArray,
    inventory_qty: dbProduct.inventory_qty as number | null,
    preorder_eta_weeks_min: dbProduct.preorder_eta_weeks_min as number | null,
    preorder_eta_weeks_max: dbProduct.preorder_eta_weeks_max as number | null,
    details_json: dbProduct.details_json as Record<string, unknown> | null,
    created_at: dbProduct.created_at as string,
    updated_at: dbProduct.updated_at as string,
  };
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(transformProduct);
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();
      
      if (error) throw error;
      return transformProduct(data);
    },
    enabled: !!slug,
  });
}

// Helper function to format price
export function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency,
  }).format(price);
}

// Helper to get ETA string
export function getEtaString(product: Product): string {
  if (product.stock_status === 'in_stock') {
    return `1–2 ${i18n.t('products.businessDaysShort')}`;
  }
  if (product.preorder_eta_weeks_min && product.preorder_eta_weeks_max) {
    return `${product.preorder_eta_weeks_min}–${product.preorder_eta_weeks_max} ${i18n.t('products.weeksShort')}`;
  }
  return `8–10 ${i18n.t('products.weeksShort')}`;
}

// Helper to get default product image
export function getProductImage(product: Product): string {
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop';
}
