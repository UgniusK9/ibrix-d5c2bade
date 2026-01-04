import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts, formatPrice, getProductImage } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';

interface CartRecommendationsProps {
  maxItems?: number;
  title?: string;
}

export function CartRecommendations({ maxItems = 4, title = "Rekomenduojama jums" }: CartRecommendationsProps) {
  const navigate = useNavigate();
  const { data: allProducts } = useProducts();
  const { items: cartItems, addItem } = useCartStore();
  const [recommendations, setRecommendations] = useState<typeof allProducts>([]);

  useEffect(() => {
    if (!allProducts) return;
    
    const cartProductIds = cartItems.map(i => i.productId);
    const otherProducts = allProducts.filter(p => !cartProductIds.includes(p.id));
    const shuffled = [...otherProducts].sort(() => Math.random() - 0.5);
    setRecommendations(shuffled.slice(0, maxItems));
  }, [allProducts, cartItems, maxItems]);

  const handleAddToCart = (product: typeof allProducts[0], e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1);
  };

  const handleViewProduct = (slug: string) => {
    navigate(`/produktas/${slug}`);
  };

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-accent" />
        <h2 className="font-heading font-semibold text-lg">{title}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <div
            key={product.id}
            className="group bg-secondary/30 rounded-xl overflow-hidden hover:shadow-premium transition-all cursor-pointer"
            onClick={() => handleViewProduct(product.slug)}
          >
            <div className="aspect-square w-full bg-secondary overflow-hidden relative">
              <img
                src={getProductImage(product)}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <Badge 
                variant="outline" 
                className={cn(
                  "absolute top-2 right-2 text-[10px]",
                  product.stock_status === 'in_stock' 
                    ? 'border-success/50 text-success bg-success/10' 
                    : 'border-primary/50 text-primary bg-primary/10'
                )}
              >
                {product.stock_status === 'in_stock' ? 'Sandėlyje' : 'Pre-order'}
              </Badge>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                {product.title}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-heading font-bold text-primary">
                  {formatPrice(product.price_eur)}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-3 h-9 text-xs group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
                onClick={(e) => handleAddToCart(product, e)}
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                Į krepšelį
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}