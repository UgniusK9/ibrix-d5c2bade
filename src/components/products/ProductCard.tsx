import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Package, Clock, Heart, Scale, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product, formatPrice, getEtaString, getProductImage } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { useComparisonStore } from "@/stores/comparisonStore";
import { useWishlist } from "@/hooks/useWishlist";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: 'Naujiena', className: 'bg-emerald-500 text-white' },
  popular: { label: 'Populiarus', className: 'bg-orange-500 text-white' },
  sale: { label: 'Akcija', className: 'bg-red-500 text-white' },
  limited: { label: 'Ribotas', className: 'bg-purple-500 text-white' },
};

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { addProduct, removeProduct, isInComparison } = useComparisonStore();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [earnRate, setEarnRate] = useState<number>(3);
  
  const isPreOrder = product.stock_status === 'preorder';
  const eta = getEtaString(product);
  const image = getProductImage(product);
  const detailsCount = (product.details_json as Record<string, unknown>)?.detailsCount as number || 0;
  const badges = (product as any).badges as string[] || [];
  const inComparison = isInComparison(product.id);
  const inWishlist = isInWishlist(product.id);
  
  // Check for sale price
  const hasSalePrice = product.sale_price_eur && product.sale_price_eur < product.price_eur;

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
      className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-secondary/30 to-muted/20 overflow-hidden">
        <img
          src={image}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Stock Badge - bottom left */}
        <div className="absolute bottom-3 left-3">
          <Badge 
            className={`text-xs font-semibold px-2.5 py-1 ${
              isPreOrder 
                ? "bg-primary text-primary-foreground" 
                : "bg-success text-success-foreground"
            }`}
          >
            {isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
          </Badge>
        </div>
        
        {/* Product Badges - top right corner */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {/* Sale badge if sale price exists */}
          {hasSalePrice && !badges.includes('sale') && (
            <Badge className="text-xs font-semibold px-2.5 py-1 bg-red-500 text-white">
              Akcija
            </Badge>
          )}
          
          {/* Admin-set badges */}
          {badges.map((badge) => {
            const config = BADGE_CONFIG[badge];
            if (!config) return null;
            return (
              <Badge key={badge} className={`text-xs font-semibold px-2.5 py-1 ${config.className}`}>
                {config.label}
              </Badge>
            );
          })}
        </div>

        {/* Wishlist heart - always visible */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 left-3 h-9 w-9 rounded-full flex items-center justify-center transition-all ${
            inWishlist 
              ? 'bg-red-500 text-white shadow-lg' 
              : 'bg-white/90 text-muted-foreground hover:bg-white hover:text-red-500 shadow'
          }`}
        >
          <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
        </button>

        {/* Other action buttons - show on hover */}
        <div className="absolute top-14 left-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onQuickView && (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-background/90"
              onClick={handleQuickView}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="secondary"
            className={`h-8 w-8 ${inComparison ? 'bg-primary/20 text-primary' : 'bg-background/90'}`}
            onClick={handleComparison}
          >
            <Scale className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* SKU Code */}
        <p className="text-xs text-muted-foreground font-mono mb-1.5">
          {product.sku}
        </p>
        
        <h3 className="font-heading font-semibold text-base mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        {/* Chips */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          {detailsCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              {detailsCount} det.
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {eta}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {hasSalePrice ? (
                <>
                  <p className="font-heading font-bold text-xl text-red-500">
                    {formatPrice(product.sale_price_eur!)}
                  </p>
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.price_eur)}
                  </p>
                </>
              ) : (
                <p className="font-heading font-bold text-xl text-accent">
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
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0 hover:bg-accent/10 hover:text-accent"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
