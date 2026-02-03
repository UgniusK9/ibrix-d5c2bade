import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, formatPrice, getProductImage } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LegoStyleProductCardProps {
  product: Product;
}

export function LegoStyleProductCard({ product }: LegoStyleProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const isOutOfStock = product.stock_status === 'out_of_stock';
  const image = getProductImage(product);
  const inWishlist = isInWishlist(product.id);
  
  // Get details count and age from details_json
  const detailsJson = product.details_json as Record<string, unknown> | null;
  const detailsCount = detailsJson?.detailsCount as number || detailsJson?.piecesCount as number || 0;
  const ageMin = detailsJson?.ageMin as number || 18;
  
  // Check for "new" badge
  const badges = product.badges || [];
  const isNew = badges.includes('new');
  
  // Check for sale price
  const hasSalePrice = product.sale_price_eur && product.sale_price_eur < product.price_eur;
  const effectivePrice = hasSalePrice ? product.sale_price_eur! : product.price_eur;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock || isAddingToCart) return;
    
    setIsAddingToCart(true);
    addItem(product);

    toast.success("Pridėta į krepšelį", {
      description: product.title,
      position: "top-center",
    });
    
    setTimeout(() => setIsAddingToCart(false), 300);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <Link
      to={`/produktas/${product.slug}`}
      className={cn(
        "group flex flex-col h-full bg-white dark:bg-card rounded-lg overflow-hidden",
        "border border-gray-200 dark:border-border",
        "transition-all duration-200",
        "hover:shadow-lg hover:border-gray-300 dark:hover:border-primary/30 hover:-translate-y-0.5",
        isOutOfStock && "opacity-70"
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-50 dark:bg-secondary/30 overflow-hidden p-4">
        {/* Yellow "Naujiena" badge - top right */}
        {isNew && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-block bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded">
              Naujiena
            </span>
          </div>
        )}
        
        {/* Sale badge if applicable */}
        {hasSalePrice && !isNew && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded">
              Akcija
            </span>
          </div>
        )}
        
        {/* Product image */}
        <img
          src={image}
          alt={product.title}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Stats row with icons */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {ageMin}+
          </span>
          {detailsCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              {detailsCount.toLocaleString('lt-LT')}
            </span>
          )}
        </div>
        
        {/* Title - 2 lines max */}
        <h3 className="font-medium text-sm text-foreground mb-2 line-clamp-2 min-h-[2.5rem] leading-tight">
          {product.title}
        </h3>

        {/* Price */}
        <div className="mb-3 mt-auto">
          {hasSalePrice ? (
            <div className="flex items-baseline gap-2">
              <p className="font-bold text-base text-foreground">
                {formatPrice(product.sale_price_eur!)}
              </p>
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price_eur)}
              </p>
            </div>
          ) : (
            <p className="font-bold text-base text-foreground">
              {formatPrice(effectivePrice)}
            </p>
          )}
        </div>

        {/* Bottom row: Add to cart button + Wishlist heart */}
        <div className="flex items-center gap-2 mt-auto">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={cn(
              "flex-1 h-10 rounded-full text-sm font-medium gap-2",
              "bg-amber-400 hover:bg-amber-500 text-amber-900",
              "dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-amber-950",
              "transition-colors duration-200",
              isOutOfStock && "bg-gray-200 text-gray-500 cursor-not-allowed"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            {isOutOfStock ? "Išparduota" : "Įtraukti į krepšelį"}
          </Button>
          
          <button
            onClick={handleWishlist}
            className={cn(
              "flex-shrink-0 h-10 w-10 rounded-full border flex items-center justify-center transition-all",
              inWishlist 
                ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-950/30 dark:border-red-800" 
                : "bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 dark:bg-card dark:border-border"
            )}
          >
            <Heart className={cn("w-4 h-4", inWishlist && "fill-current")} />
          </button>
        </div>
      </div>
    </Link>
  );
}
