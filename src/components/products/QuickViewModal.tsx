import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Clock, X, Heart, Bell } from "lucide-react";
import { Product, formatPrice, getEtaString, getProductImage } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { StockNotificationForm } from "./StockNotificationForm";

interface QuickViewModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: 'Naujiena', className: 'bg-green-500 text-white' },
  popular: { label: 'Populiarus', className: 'bg-orange-500 text-white' },
  sale: { label: 'Išpardavimas', className: 'bg-red-500 text-white' },
  limited: { label: 'Ribotas', className: 'bg-purple-500 text-white' },
};

export function QuickViewModal({ product, open, onOpenChange }: QuickViewModalProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) return null;

  const isPreOrder = product.stock_status === 'preorder';
  const isOutOfStock = product.stock_status === 'out_of_stock';
  const eta = getEtaString(product);
  const image = getProductImage(product);
  const detailsCount = (product.details_json as Record<string, unknown>)?.detailsCount as number || 0;
  const badges = (product as any).badges as string[] || [];
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem(product);
    toast.success("Pridėta į krepšelį", {
      description: product.title,
      position: "top-center",
    });
    onOpenChange(false);
  };

  const handleWishlist = () => {
    toggleWishlist(product.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">{product.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Greita peržiūra: {product.title}
        </DialogDescription>
        
        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square bg-gradient-to-br from-secondary/30 to-muted/20">
            <img
              src={image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <Badge 
                className={`text-xs font-semibold px-2.5 py-1 ${
                  isOutOfStock 
                    ? "bg-muted text-muted-foreground"
                    : isPreOrder 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-success text-success-foreground"
                }`}
              >
                {isOutOfStock ? "IŠPARDUOTA" : isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
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
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col">
            {/* SKU */}
            <p className="text-xs text-muted-foreground font-mono mb-1">{product.sku}</p>
            
            {/* Title */}
            <h3 className="font-heading text-xl font-bold mb-3">{product.title}</h3>

            {/* Price */}
            <p className="font-heading text-2xl font-bold text-accent mb-4">
              {formatPrice(product.price_eur)}
            </p>

            {/* Info chips */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              {detailsCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  {detailsCount} det.
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {eta}
              </span>
            </div>

            {/* Description */}
            {product.short_desc && (
              <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                {product.short_desc}
              </p>
            )}

            <div className="flex-1" />

            {/* Actions */}
            {isOutOfStock ? (
              <div className="space-y-3">
                <StockNotificationForm productId={product.id} />
              </div>
            ) : (
              <div className="space-y-3">
                <Button 
                  size="lg" 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isPreOrder ? "Užsisakyti (pre-order)" : "Į krepšelį"}
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className={`flex-1 ${inWishlist ? 'border-red-300 text-red-500' : ''}`}
                    onClick={handleWishlist}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${inWishlist ? 'fill-current' : ''}`} />
                    {inWishlist ? 'Wishlist\'e' : 'Į wishlist'}
                  </Button>
                  
                  <Button variant="outline" asChild className="flex-1">
                    <Link to={`/produktas/${product.slug}`} onClick={() => onOpenChange(false)}>
                      Daugiau info
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
