import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductVariant {
  id: string;
  name: string;
  sku_suffix: string;
  option_type: string;
  option_value: string;
  price_adjustment_eur: number;
  inventory_qty: number;
  status: 'active' | 'inactive';
  sort_order: number;
}

export function useProductVariants(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async (): Promise<ProductVariant[]> => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'active')
        .order('sort_order');
      
      if (error) throw error;
      
      return (data || []).map(v => ({
        ...v,
        status: v.status as 'active' | 'inactive'
      }));
    },
    enabled: !!productId,
  });
}

// Group variants by option type
export function groupVariantsByType(variants: ProductVariant[]): Record<string, ProductVariant[]> {
  return variants.reduce((acc, variant) => {
    const type = variant.option_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);
}

export function getOptionTypeLabel(type: string): string {
  switch (type) {
    case 'size': return 'Dydis';
    case 'color': return 'Spalva';
    default: return 'Variantas';
  }
}
