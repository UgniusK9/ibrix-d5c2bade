import { Link } from "react-router-dom";
import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShopifyProduct, formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface ProductCardProps {
  product: ShopifyProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { node } = product;
  
  const firstVariant = node.variants.edges[0]?.node;
  const image = node.images.edges[0]?.node;
  const price = node.priceRange.minVariantPrice;
  const isAvailable = firstVariant?.availableForSale ?? false;
  
  // Determine status (for demo - in production this would come from metafields)
  const isPreOrder = !isAvailable || node.title.toLowerCase().includes('pre-order');

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
      className="group block bg-card rounded-xl overflow-hidden shadow-premium hover:shadow-premium-lg transition-all duration-300 hover-lift"
    >
      {/* Image */}
      <div className="relative aspect-square bg-secondary/50 overflow-hidden">
        {image ? (
          <img
            src={image.url}
            alt={image.altText || node.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Nėra nuotraukos
          </div>
        )}
        
        {/* Status Badge */}
        <Badge 
          className={`absolute top-3 left-3 ${
            isPreOrder 
              ? "bg-primary text-primary-foreground" 
              : "bg-success text-success-foreground"
          }`}
        >
          {isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
        </Badge>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg shadow-lg">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Peržiūrėti</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {node.title}
        </h3>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 text-xs bg-secondary rounded-md text-muted-foreground">
            {isPreOrder ? "8–10 sav." : "1–2 d.d."}
          </span>
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-heading font-bold text-xl">
              {formatPrice(price.amount, price.currencyCode)}
            </p>
            <p className="text-xs text-muted-foreground">
              Nemokamas siuntimas
            </p>
          </div>
          
          <Button
            size="icon"
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
