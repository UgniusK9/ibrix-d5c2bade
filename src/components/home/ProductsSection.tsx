import { Link } from "react-router-dom";
import { ArrowRight, Package, Clock, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts, formatPrice, getEtaString, getProductImage, Product } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

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
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (error || displayProducts.length === 0) {
    return null; // Don't show section if no products
  }

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-2 block">
              KOLEKCIJA
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Varikliai
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Filtruokite pagal tipą, sudėtingumą, detalių skaičių ir pristatymo statusą.
            </p>
          </div>
          
          <Button asChild variant="outline" className="w-fit h-10 px-5">
            <Link to="/varikliai">
              Peržiūrėti visus
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.map((product) => {
            const isPreOrder = product.stock_status === 'preorder';
            const eta = getEtaString(product);
            const image = getProductImage(product);
            const detailsCount = (product.details_json as Record<string, unknown>)?.detailsCount as number || 0;
            
            return (
              <Link
                key={product.id}
                to={`/produktas/${product.slug}`}
                className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
              >
                <div className="relative aspect-square bg-gradient-to-br from-secondary/30 to-muted/20 overflow-hidden">
                  <img
                    src={image}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <Badge className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 ${isPreOrder ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"}`}>
                    {isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
                  </Badge>
                </div>
                <div className="p-5">
                  <p className="text-xs text-muted-foreground font-mono mb-1.5">
                    {product.sku}
                  </p>
                  <h3 className="font-heading font-semibold text-base mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>
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
                  <div className="flex items-center justify-between">
                    <p className="font-heading font-bold text-xl text-accent">
                      {formatPrice(product.price_eur)}
                    </p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-9 w-9 p-0 hover:bg-accent/10 hover:text-accent"
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      <ShoppingCart className="h-4 w-4" />
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
