import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShoppingCart, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts, formatPrice, getEtaString, getProductImage, Product } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { motion } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type TabFilter = 'featured' | 'popular' | 'new';

export function RecommendationsCarousel() {
  const { data: products, isLoading } = useProducts();
  const addItem = useCartStore((state) => state.addItem);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('featured');

  // Filter products based on tab
  const recommendations = useMemo(() => {
    if (!products) return [];
    
    switch (activeTab) {
      case 'popular':
        // Sort by some metric or random for now
        return [...products].slice(0, 8);
      case 'new':
        // Most recent
        return [...products]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 8);
      case 'featured':
      default:
        // Random shuffle for featured
        return [...products].sort(() => Math.random() - 0.5).slice(0, 8);
    }
  }, [products, activeTab]);

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

  if (isLoading || !products || products.length === 0) {
    return null;
  }

  const tabs: { id: TabFilter; label: string }[] = [
    { id: 'featured', label: 'Atrinkti' },
    { id: 'popular', label: 'Populiarūs' },
    { id: 'new', label: 'Naujienos' },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/20 to-background overflow-hidden">
      <div className="container overflow-visible">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">
            Rask tobulą produktą
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Sužinok apie mūsų produktus, kuriuos verta patirti.
          </p>
        </div>

        {/* Tabs & Navigation */}
        <div className="flex items-center justify-between mb-8">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
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
            const isNew = new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 w-[260px] snap-start"
              >
                <Link
                  to={`/produktas/${product.slug}`}
                  className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-secondary/30 to-muted/20 overflow-hidden">
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {isNew && (
                        <Badge className="bg-accent text-accent-foreground font-semibold text-[10px] px-2 py-0.5">
                          Naujiena
                        </Badge>
                      )}
                    </div>
                    
                    {/* Quick add button */}
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      {detailsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {detailsCount}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getEtaString(product)}
                      </span>
                    </div>
                    
                    <h3 className="font-heading font-semibold text-sm mb-3 line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
                      {product.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-lg text-accent">
                        {formatPrice(product.price_eur)}
                      </span>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-medium",
                        isPreOrder ? "border-primary/30 text-primary" : "border-success/30 text-success"
                      )}>
                        {isPreOrder ? "Pre-order" : "Sandėlyje"}
                      </Badge>
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