import { useProducts, type Product } from '@/hooks/useProducts';
import { ProductCard } from '@/components/products/ProductCard';
import { Loader2 } from 'lucide-react';

interface RelatedProductsProps {
  currentProductId: string;
  category: string;
  categoryId?: string | null;
  tags?: string[];
}

// Calculate tag overlap score
function getTagOverlapScore(productTags: string[], currentTags: string[]): number {
  if (!productTags?.length || !currentTags?.length) return 0;
  return productTags.filter(tag => currentTags.includes(tag)).length;
}

export function RelatedProducts({ currentProductId, category, categoryId, tags = [] }: RelatedProductsProps) {
  const { data: products, isLoading } = useProducts();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filter and score related products
  const relatedProducts = (products || [])
    .filter(p => p.id !== currentProductId)
    .map(p => {
      let score = 0;
      
      // Tag overlap score (highest priority)
      score += getTagOverlapScore(p.tags || [], tags) * 3;
      
      // Same category_id
      if (categoryId && p.category_id === categoryId) score += 2;
      
      // Same category enum
      if (p.category === category) score += 1;
      
      return { product: p, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(item => item.product);

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
