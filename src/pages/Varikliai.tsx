import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Package, Clock, ShoppingCart, Filter, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts, formatPrice, getEtaString, getProductImage, Product } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StatusFilter = "all" | "preorder" | "in_stock";

export default function Varikliai() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const addItem = useCartStore((state) => state.addItem);
  const { data: products, isLoading, error } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      if (statusFilter !== "all" && p.stock_status !== statusFilter) return false;
      return true;
    });
  }, [products, statusFilter]);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success("Pridėta į krepšelį", {
      description: product.title,
      position: "top-center",
    });
  };

  return (
    <PageLayout>
      <section className="py-12 md:py-16 bg-secondary/30">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
              Varikliai
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Mechaninių konstruktorių kolekcija su realiai judančiais mechanizmais. 
              Išsirinkite savo mėgstamą konfigūraciją.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8 p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrai:</span>
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statusas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visi statusai</SelectItem>
                <SelectItem value="preorder">Pre-order</SelectItem>
                <SelectItem value="in_stock">Sandėlyje</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-xl p-6 text-center">
              Nepavyko užkrauti produktų. Bandykite vėliau.
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
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
          )}

          {!isLoading && !error && filteredProducts.length === 0 && (
            <div className="bg-card rounded-2xl p-12 text-center border border-border">
              <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
              <h3 className="font-heading text-xl font-semibold mb-2">
                Produktų nerasta
              </h3>
              <p className="text-muted-foreground">
                Pagal pasirinktus filtrus produktų nerasta. Pabandykite pakeisti filtrus.
              </p>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
