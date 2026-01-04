import { Link } from "react-router-dom";
import { ShoppingCart, Package, Clock, Heart, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product, formatPrice, getEtaString, getProductImage } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { useComparisonStore } from "@/stores/comparisonStore";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: 'Naujiena', className: 'bg-green-500 text-white' },
  popular: { label: 'Populiarus', className: 'bg-orange-500 text-white' },
  sale: { label: 'Išpardavimas', className: 'bg-red-500 text-white' },
  limited: { label: 'Ribotas', className: 'bg-purple-500 text-white' },
};

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { addProduct, removeProduct, isInComparison } = useComparisonStore();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const isPreOrder = product.stock_status === 'preorder';
  const eta = getEtaString(product);
  const image = getProductImage(product);
  const detailsCount = (product.details_json as Record<string, unknown>)?.detailsCount as number || 0;
  const badges = (product as any).badges as string[] || [];
  const inComparison = isInComparison(product.id);
  const inWishlist = isInWishlist(product.id);

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
        
        {/* Badges row */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge 
            className={`text-xs font-semibold px-2.5 py-1 ${
              isPreOrder 
                ? "bg-primary text-primary-foreground" 
                : "bg-success text-success-foreground"
            }`}
          >
            {isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
          </Badge>
          
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

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className={`h-8 w-8 ${inWishlist ? 'bg-red-100 text-red-500' : 'bg-background/90'}`}
            onClick={handleWishlist}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
          </Button>
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
          <p className="font-heading font-bold text-xl text-accent">
            {formatPrice(product.price_eur)}
          </p>
          
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
