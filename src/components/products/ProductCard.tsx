import { Link } from "react-router-dom";
import { ShoppingCart, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShopifyProduct, formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface ProductCardProps {
  product: ShopifyProduct;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { node } = product;
  
  const firstVariant = node.variants.edges[0]?.node;
  const image = node.images.edges[0]?.node;
  const price = node.priceRange.minVariantPrice;
  const isAvailable = firstVariant?.availableForSale ?? false;
  
  // Determine status
  const isPreOrder = !isAvailable || node.title.toLowerCase().includes('pre-order');
  
  // Generate SKU-like code
  const skuCode = `ORB-ENG-${10168 + index}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!firstVariant) return;

    addItem({
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || [],
    });

    toast.success("Pridėta į krepšelį", {
      description: node.title,
      position: "top-center",
    });
  };

  return (
    <Link
      to={`/produktas/${node.handle}`}
      className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-secondary/30 to-muted/20 overflow-hidden">
        {image ? (
          <img
            src={image.url}
            alt={image.altText || node.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
            <Package className="w-16 h-16" strokeWidth={1} />
          </div>
        )}
        
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
          {skuCode}
        </p>
        
        <h3 className="font-heading font-semibold text-base mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {node.title}
        </h3>

        {/* Chips */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            2899 det.
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {isPreOrder ? "→ 8-10 sav." : "1-2 d.d."}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <p className="font-heading font-bold text-xl text-accent">
            {formatPrice(price.amount, price.currencyCode)}
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
