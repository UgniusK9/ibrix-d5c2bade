import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShoppingCart, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts, formatPrice, getEtaString, getProductImage, Product } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

export function RecommendationsCarousel() {
  const { data: products, isLoading } = useProducts();
  const addItem = useCartStore((state) => state.addItem);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Random shuffle for "recommendations"
  const recommendations = products?.slice().sort(() => Math.random() - 0.5).slice(0, 8) || [];

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  if (isLoading || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-2 block">
              REKOMENDUOJAMA
            </span>
            <h2 className="font-heading text-2xl md:text-3xl font-bold">
              Jums gali patikti
            </h2>
          </div>
          
          {/* Navigation */}
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="h-10 w-10 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="h-10 w-10 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recommendations.map((product, index) => {
            const isPreOrder = product.stock_status === 'preorder';
            const detailsCount = (product.details_json as Record<string, unknown>)?.detailsCount as number || 0;
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 w-[280px] snap-start"
              >
                <Link
                  to={`/produktas/${product.slug}`}
                  className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-secondary/30 to-muted/20 overflow-hidden">
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-lg ${isPreOrder ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"}`}>
                      {isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-heading font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      {detailsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {detailsCount} det.
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getEtaString(product)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-lg text-accent">
                        {formatPrice(product.price_eur)}
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 hover:bg-accent/10 hover:text-accent"
                        onClick={(e) => handleAddToCart(product, e)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
