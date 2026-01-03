import { Link } from "react-router-dom";
import { ShoppingCart, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product, formatPrice, getEtaString, getProductImage } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  
  const isPreOrder = product.stock_status === 'preorder';
  const eta = getEtaString(product);
  const image = getProductImage(product);
  const detailsCount = (product.details_json as Record<string, unknown>)?.detailsCount as number || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem(product);

    toast.success("Pridėta į krepšelį", {
      description: product.title,
      position: "top-center",
    });
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
        
        {/* Status Badge */}
        <Badge 
          className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 ${
            isPreOrder 
              ? "bg-primary text-primary-foreground" 
              : "bg-success text-success-foreground"
          }`}
        >
          {isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
        </Badge>
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
