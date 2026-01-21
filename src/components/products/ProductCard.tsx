import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Package, Clock, Heart, Scale, Eye, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product, formatPrice, getEtaString, getProductImage } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { useComparisonStore } from "@/stores/comparisonStore";
import { useWishlist } from "@/hooks/useWishlist";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  compact?: boolean;
}

const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: 'Naujiena', className: 'bg-success text-success-foreground' },
  popular: { label: 'Populiarus', className: 'bg-accent text-accent-foreground' },
  sale: { label: 'Akcija', className: 'bg-destructive text-destructive-foreground' },
  limited: { label: 'Ribotas', className: 'bg-primary text-primary-foreground' },
};

export function ProductCard({ product, onQuickView, compact = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { addProduct, removeProduct, isInComparison } = useComparisonStore();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [earnRate, setEarnRate] = useState<number>(3);
  
  const isPreOrder = product.stock_status === 'preorder';
  const isOutOfStock = product.stock_status === 'out_of_stock';
  const eta = getEtaString(product);
  const image = getProductImage(product);
  const detailsCount = (product.details_json as Record<string, unknown>)?.detailsCount as number || 0;
  const badges = (product as any).badges as string[] || [];
  const inComparison = isInComparison(product.id);
  const inWishlist = isInWishlist(product.id);
  
  // Check for sale price
  const hasSalePrice = product.sale_price_eur && product.sale_price_eur < product.price_eur;
  const discountPercent = hasSalePrice 
    ? Math.round((1 - product.sale_price_eur! / product.price_eur) * 100)
    : 0;

  // Calculate credits earned based on price
  const effectivePrice = hasSalePrice ? product.sale_price_eur! : product.price_eur;
  const creditsEarned = (effectivePrice * earnRate / 100).toFixed(2);

  useEffect(() => {
    // Load credits earn rate setting
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'credits.earn_rate_percent')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === 'object' && 'value' in data.value) {
          setEarnRate(Number((data.value as { value: number }).value));
        }
      });
  }, []);

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) return;
    
    addItem(product);

    toast.success("Pridėta į krepšelį", {
      description: product.title,
      position: "top-center",
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleComparison = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inComparison) {
      removeProduct(product.id);
      toast.success("Pašalinta iš palyginimo");
    } else {
      const added = addProduct(product);
      if (added) {
        toast.success("Pridėta į palyginimą");
      } else {
        toast.error("Galima palyginti tik 3 produktus");
      }
    }
  };

  return (
    <Link
      to={`/produktas/${product.slug}`}
      className={cn(
        "group block bg-card rounded-xl overflow-hidden border border-border transition-all duration-200",
        "hover:shadow-medium hover:border-primary/20 hover:-translate-y-0.5",
        isOutOfStock && "opacity-75"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square bg-secondary/30 overflow-hidden">
        <img
          src={image}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Stock Badge - bottom left */}
        <div className="absolute bottom-3 left-3">
          <Badge 
            className={cn(
              "text-xs font-bold px-2.5 py-1 shadow-sm",
              isOutOfStock 
                ? "bg-muted text-muted-foreground"
                : isPreOrder 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-success text-success-foreground"
            )}
          >
            {isOutOfStock ? "IŠPARDUOTA" : isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
          </Badge>
        </div>
        
        {/* Product Badges - top right corner */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {/* Sale badge with discount % */}
          {hasSalePrice && (
            <Badge className="text-xs font-bold px-2.5 py-1 bg-destructive text-destructive-foreground shadow-sm">
              -{discountPercent}%
            </Badge>
          )}
          
          {/* Admin-set badges */}
          {badges.filter(b => b !== 'sale').map((badge) => {
            const config = BADGE_CONFIG[badge];
            if (!config) return null;
            return (
              <Badge key={badge} className={cn("text-xs font-bold px-2.5 py-1 shadow-sm", config.className)}>
                {config.label}
              </Badge>
            );
          })}
        </div>

        {/* Wishlist heart - always visible, top left */}
        <button
          onClick={handleWishlist}
          className={cn(
            "absolute top-3 left-3 h-9 w-9 rounded-full flex items-center justify-center transition-all shadow-sm",
            inWishlist 
              ? "bg-destructive text-destructive-foreground" 
              : "bg-card/90 text-muted-foreground hover:text-destructive hover:bg-card"
          )}
        >
          <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
        </button>

        {/* Action buttons - show on hover */}
        <div className="absolute top-14 left-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onQuickView && (
            <Button
              size="icon-sm"
              variant="secondary"
              className="bg-card/90 shadow-sm"
              onClick={handleQuickView}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon-sm"
            variant="secondary"
            className={cn(
              "shadow-sm",
              inComparison ? "bg-primary text-primary-foreground" : "bg-card/90"
            )}
            onClick={handleComparison}
          >
            <Scale className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={cn("p-4", compact && "p-3")}>
        {/* SKU Code */}
        <p className="text-xs text-muted-foreground font-mono mb-1">
          {product.sku}
        </p>
        
        <h3 className={cn(
          "font-heading font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors",
          compact ? "text-sm" : "text-base"
        )}>
          {product.title}
        </h3>

        {/* Info chips */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          {detailsCount > 0 && (
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              {detailsCount} det.
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {eta}
          </span>
        </div>

        {/* Price and CTA */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              {hasSalePrice ? (
                <>
                  <p className="font-heading font-bold text-lg text-destructive">
                    {formatPrice(product.sale_price_eur!)}
                  </p>
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.price_eur)}
                  </p>
                </>
              ) : (
                <p className="font-heading font-bold text-lg text-foreground">
                  {formatPrice(product.price_eur)}
                </p>
              )}
            </div>
            {/* Credits earned */}
            <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3" />
              +{creditsEarned}€ kreditų
            </p>
          </div>
          
          <Button
            size="icon"
            variant={isOutOfStock ? "secondary" : "accent"}
            className={cn("flex-shrink-0", isOutOfStock && "pointer-events-none")}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
