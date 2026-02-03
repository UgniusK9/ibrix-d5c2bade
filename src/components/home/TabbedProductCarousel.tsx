import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi 
} from "@/components/ui/carousel";
import { LegoStyleProductCard } from "./LegoStyleProductCard";
import { Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface TabbedProductCarouselProps {
  products: Product[];
}

interface Tab {
  id: string;
  label: string;
  filter: (products: Product[]) => Product[];
}

const tabs: Tab[] = [
  {
    id: "featured",
    label: "Atrinkti",
    filter: (products) => products.filter(p => 
      p.badges?.includes('popular') || p.badges?.includes('new') || true
    ).slice(0, 10),
  },
  {
    id: "popular",
    label: "Populiarūs",
    filter: (products) => products.filter(p => 
      p.badges?.includes('popular')
    ).slice(0, 10),
  },
  {
    id: "girls",
    label: "Žaislai mergaitėms",
    filter: (products) => products.filter(p => 
      p.tags?.some(t => t.toLowerCase().includes('mergait') || t.toLowerCase().includes('girl')) ||
      p.category?.toLowerCase().includes('gėl') ||
      p.category?.toLowerCase().includes('flower')
    ).slice(0, 10),
  },
];

export function TabbedProductCarousel({ products }: TabbedProductCarouselProps) {
  const [activeTab, setActiveTab] = useState<string>("featured");
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const activeTabData = tabs.find(t => t.id === activeTab) || tabs[0];
  const filteredProducts = activeTabData.filter(products);
  
  // Fallback: if filtered is empty, show all products
  const displayProducts = filteredProducts.length > 0 ? filteredProducts : products.slice(0, 10);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
    
    // Calculate progress
    const progress = Math.max(0, Math.min(1, api.scrollProgress()));
    setScrollProgress(progress);
  }, [api]);

  useEffect(() => {
    if (!api) return;
    
    onSelect();
    api.on("select", onSelect);
    api.on("scroll", onSelect);
    api.on("reInit", onSelect);
    
    return () => {
      api.off("select", onSelect);
      api.off("scroll", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  // Reset carousel when tab changes
  useEffect(() => {
    if (api) {
      api.scrollTo(0);
    }
  }, [activeTab, api]);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-gray-50 dark:bg-background">
      <div className="container">
        {/* Centered Title */}
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-6">
          Rask tobulą rinkinį
        </h2>

        {/* Header row: Tabs on left, Arrows on right */}
        <div className="flex items-center justify-between mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-lg",
                  activeTab === tab.id
                    ? "text-foreground border-b-2 border-foreground bg-transparent"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Arrow Controls */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className={cn(
                "h-10 w-10 rounded-full border flex items-center justify-center transition-all",
                canScrollPrev 
                  ? "border-gray-300 dark:border-border text-foreground hover:bg-gray-100 dark:hover:bg-secondary" 
                  : "border-gray-200 dark:border-border/50 text-muted-foreground/50 cursor-not-allowed"
              )}
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className={cn(
                "h-10 w-10 rounded-full border flex items-center justify-center transition-all",
                canScrollNext 
                  ? "border-gray-300 dark:border-border text-foreground hover:bg-gray-100 dark:hover:bg-secondary" 
                  : "border-gray-200 dark:border-border/50 text-muted-foreground/50 cursor-not-allowed"
              )}
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Carousel */}
        <Carousel
          opts={{
            align: "start",
            loop: false,
            skipSnaps: false,
            dragFree: false,
          }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {displayProducts.map((product) => (
              <CarouselItem 
                key={product.id} 
                className="pl-3 md:pl-4 basis-[80%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
              >
                <LegoStyleProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Progress Indicator */}
        <div className="mt-6 flex justify-center">
          <div className="w-32 md:w-48 h-1 bg-gray-200 dark:bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-500 dark:bg-foreground/50 rounded-full transition-all duration-150"
              style={{ 
                width: `${Math.max(20, (scrollProgress * 100) + 20)}%`,
                marginLeft: `${scrollProgress * 60}%`
              }}
            />
          </div>
        </div>

        {/* Mobile Arrows - below carousel */}
        <div className="flex md:hidden items-center justify-center gap-4 mt-4">
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={cn(
              "h-10 w-10 rounded-full border flex items-center justify-center transition-all",
              canScrollPrev 
                ? "border-gray-300 dark:border-border text-foreground" 
                : "border-gray-200 dark:border-border/50 text-muted-foreground/50"
            )}
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={cn(
              "h-10 w-10 rounded-full border flex items-center justify-center transition-all",
              canScrollNext 
                ? "border-gray-300 dark:border-border text-foreground" 
                : "border-gray-200 dark:border-border/50 text-muted-foreground/50"
            )}
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
