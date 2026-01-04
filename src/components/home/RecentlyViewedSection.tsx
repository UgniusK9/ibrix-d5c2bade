import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { supabase } from "@/integrations/supabase/client";
import { Product, getProductImage, formatPrice, transformProduct } from "@/hooks/useProducts";
import { motion } from "framer-motion";

export function RecentlyViewedSection() {
  const { productIds } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const prevIdsRef = useRef<string>('');

  useEffect(() => {
    // Stringify for stable comparison
    const idsKey = productIds.join(',');
    if (idsKey === prevIdsRef.current) return;
    prevIdsRef.current = idsKey;

    const fetchProducts = async () => {
      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('status', 'active');

        if (error) throw error;

        // Transform and sort by the order in productIds (most recent first)
        const transformedData = (data || []).map(d => transformProduct(d as Record<string, unknown>));
        const sorted = productIds
          .map((id) => transformedData.find((p) => p.id === id))
          .filter((p): p is Product => p !== undefined);

        setProducts(sorted);
      } catch (error) {
        console.error('Failed to fetch recently viewed products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [productIds]);

  // Don't render if no products or still loading with no cached data
  if (loading && products.length === 0) return null;
  if (products.length === 0) return null;

  return (
    <section className="py-8 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-heading text-base font-bold">Neseniai peržiūrėti</h2>
          </div>
          
          <Button variant="ghost" size="sm" asChild>
            <Link to="/produktai/visi" className="flex items-center gap-1 text-xs">
              Visi produktai
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>

        {/* Products scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Link
                to={`/produktas/${product.slug}`}
                className="flex-shrink-0 w-32 group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-secondary/30 to-muted/20 border border-border group-hover:border-primary/30 transition-colors mb-2">
                  <img
                    src={getProductImage(product)}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-medium text-xs line-clamp-2 group-hover:text-primary transition-colors mb-0.5">
                  {product.title}
                </h3>
                <p className="font-heading font-bold text-sm text-accent">
                  {formatPrice(product.price_eur)}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
