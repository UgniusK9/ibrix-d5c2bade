import { useProducts, type Product } from '@/hooks/useProducts';
import { ProductCard } from '@/components/products/ProductCard';
import { Loader2 } from 'lucide-react';

interface RelatedProductsProps {
  currentProductId: string;
  category: string;
  categoryId?: string | null;
}

export function RelatedProducts({ currentProductId, category, categoryId }: RelatedProductsProps) {
  const { data: products, isLoading } = useProducts();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filter related products by same category, excluding current product
  const relatedProducts = (products || [])
    .filter(p => p.id !== currentProductId)
    .filter(p => {
      // First try to match by category_id if available
      if (categoryId && p.category_id) {
        return p.category_id === categoryId;
      }
      // Fall back to category enum
      return p.category === category;
    })
    .slice(0, 4);

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 border-t border-border">
      <div className="container">
        <h2 className="font-heading text-2xl font-bold mb-8">Panašūs produktai</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {relatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
