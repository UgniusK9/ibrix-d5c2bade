import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts, formatPrice, getProductImage, Product } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Badge configuration with LEGO-style colors
const stockBadges = {
  preorder: { label: "Pre-order", bg: "bg-blue-500", text: "text-white" },
  in_stock: { label: "Sandėlyje", bg: "bg-green-500", text: "text-white" },
  out_of_stock: { label: "Išparduota", bg: "bg-gray-400", text: "text-white" },
};

// Product badge configuration
const productBadges: Record<string, { label: string; bg: string }> = {
  new: { label: "Naujiena", bg: "bg-emerald-500" },
  popular: { label: "Populiarus", bg: "bg-orange-500" },
  sale: { label: "Akcija", bg: "bg-red-500" },
  limited: { label: "Ribotas", bg: "bg-purple-500" },
};

export function ProductsSection() {
  const addItem = useCartStore((state) => state.addItem);
  const { data: products, isLoading, error } = useProducts();
  
  // Display first 6 products
  const displayProducts = products?.slice(0, 6) || [];

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success("Pridėta į krepšelį", {
      description: product.title,
      position: "top-center",
    });
  };

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </section>
    );
  }

  if (error || displayProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-slate-50">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              Populiarūs konstruktoriai
            </h2>
            <p className="text-muted-foreground mt-1">
              Atrask mūsų geriausius modelius
            </p>
          </div>
          
          <Button asChild variant="outline" className="w-fit">
            <Link to="/produktai/visi">
              Peržiūrėti visus konstruktorius
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {displayProducts.map((product) => {
            const stockStatus = product.stock_status || 'preorder';
            const badge = stockBadges[stockStatus] || stockBadges.preorder;
            const image = getProductImage(product);
            const badges = (product as any).badges as string[] || [];
            const hasSale = product.sale_price_eur && product.sale_price_eur < product.price_eur;
            
            return (
              <Link
                key={product.id}
                to={`/produktas/${product.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden border border-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                {/* Image container - takes ~70% of card */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden p-4">
                  <img
                    src={image}
                    alt={product.title}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Stock badge - bottom left */}
                  <div className={cn(
                    "absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold",
                    badge.bg,
                    badge.text
                  )}>
                    {badge.label}
                  </div>

                  {/* Product badges - top right */}
                  {(badges.length > 0 || hasSale) && (
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      {hasSale && !badges.includes('sale') && (
                        <Badge className="bg-red-500 text-white text-xs font-bold px-2 py-0.5">
                          Akcija
                        </Badge>
                      )}
                      {badges.map((badgeKey) => {
                        const config = productBadges[badgeKey];
                        if (!config) return null;
                        return (
                          <Badge key={badgeKey} className={cn(config.bg, "text-white text-xs font-bold px-2 py-0.5")}>
                            {config.label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Content - minimal and clean */}
                <div className="p-4 md:p-5">
                  <h3 className="font-heading font-bold text-base md:text-lg text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      {product.sale_price_eur && product.sale_price_eur < product.price_eur ? (
                        <>
                          <span className="font-heading font-bold text-xl text-red-500">
                            {formatPrice(product.sale_price_eur)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.price_eur)}
                          </span>
                        </>
                      ) : (
                        <span className="font-heading font-bold text-xl text-foreground">
                          {formatPrice(product.price_eur)}
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="bg-yellow-400 hover:bg-yellow-500 text-foreground font-bold h-9 px-4"
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Į krepšelį
                    </Button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
