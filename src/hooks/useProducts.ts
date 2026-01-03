import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  short_desc: string | null;
  price_eur: number;
  deposit_eur: number;
  sku: string;
  stock_status: 'preorder' | 'in_stock' | 'out_of_stock';
  status: 'active' | 'inactive';
  category: string;
  images: string[];
  inventory_qty: number | null;
  preorder_eta_weeks_min: number | null;
  preorder_eta_weeks_max: number | null;
  details_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Transform DB product to our Product interface
function transformProduct(dbProduct: Record<string, unknown>): Product {
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

  return {
    id: dbProduct.id as string,
    slug: dbProduct.slug as string,
    title: dbProduct.title as string,
    description: dbProduct.description as string | null,
    short_desc: dbProduct.short_desc as string | null,
    price_eur: Number(dbProduct.price_eur),
    deposit_eur: Number(dbProduct.deposit_eur),
    sku: dbProduct.sku as string,
    stock_status: dbProduct.stock_status as 'preorder' | 'in_stock' | 'out_of_stock',
    status: dbProduct.status as 'active' | 'inactive',
    category: dbProduct.category as string,
    images: imageArray,
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
    return '1–2 d.d.';
  }
  if (product.preorder_eta_weeks_min && product.preorder_eta_weeks_max) {
    return `${product.preorder_eta_weeks_min}–${product.preorder_eta_weeks_max} sav.`;
  }
  return '8–10 sav.';
}

// Helper to get default product image
export function getProductImage(product: Product): string {
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop';
}
