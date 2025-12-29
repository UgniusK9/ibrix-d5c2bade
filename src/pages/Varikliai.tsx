import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Package, Clock, ShoppingCart, Filter, ChevronDown } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockProducts, MockProduct, formatMockPrice } from "@/data/mockProducts";
import { fetchProducts, ShopifyProduct, formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StatusFilter = "all" | "pre-order" | "in-stock";
type PartsFilter = "all" | "under-1500" | "1500-2500" | "over-2500";

export default function Varikliai() {
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [partsFilter, setPartsFilter] = useState<PartsFilter>("all");
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const data = await fetchProducts(20);
      setShopifyProducts(data);
      setLoading(false);
    }
    loadProducts();
  }, []);

  // Use Shopify products if available, otherwise use mock products
  const hasShopifyProducts = shopifyProducts.length > 0;

  const filteredMockProducts = useMemo(() => {
    return mockProducts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (partsFilter === "under-1500" && p.detailsCount >= 1500) return false;
      if (partsFilter === "1500-2500" && (p.detailsCount < 1500 || p.detailsCount > 2500)) return false;
      if (partsFilter === "over-2500" && p.detailsCount <= 2500) return false;
      return true;
    });
  }, [statusFilter, partsFilter]);

  const handleAddMockToCart = (product: MockProduct, e: React.MouseEvent) => {
    e.preventDefault();
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
                <SelectItem value="pre-order">Pre-order</SelectItem>
                <SelectItem value="in-stock">Sandėlyje</SelectItem>
              </SelectContent>
            </Select>

            <Select value={partsFilter} onValueChange={(v) => setPartsFilter(v as PartsFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Detalių sk." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visos detalės</SelectItem>
                <SelectItem value="under-1500">&lt; 1500 det.</SelectItem>
                <SelectItem value="1500-2500">1500–2500 det.</SelectItem>
                <SelectItem value="over-2500">&gt; 2500 det.</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse border border-border">
                  <div className="aspect-square bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-muted rounded w-20" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-6 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasShopifyProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shopifyProducts.map((product, index) => {
                const { node } = product;
                const firstVariant = node.variants.edges[0]?.node;
                const image = node.images.edges[0]?.node;
                const price = node.priceRange.minVariantPrice;
                const isAvailable = firstVariant?.availableForSale ?? false;
                const isPreOrder = !isAvailable;

                return (
                  <Link
                    key={node.id}
                    to={`/produktas/${node.handle}`}
                    className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
                  >
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
                      <Badge className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 ${isPreOrder ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"}`}>
                        {isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
                      </Badge>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-muted-foreground font-mono mb-1.5">
                        ORB-ENG-{10168 + index}
                      </p>
                      <h3 className="font-heading font-semibold text-base mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {node.title}
                      </h3>
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
                      <div className="flex items-center justify-between">
                        <p className="font-heading font-bold text-xl text-accent">
                          {formatPrice(price.amount, price.currencyCode)}
                        </p>
                        <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-accent/10 hover:text-accent">
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMockProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/produktas/${product.handle}`}
                  className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-secondary/30 to-muted/20 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <Badge className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 ${product.status === "pre-order" ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"}`}>
                      {product.status === "pre-order" ? "PRE-ORDER" : "SANDĖLYJE"}
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
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        {product.detailsCount} det.
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {product.eta}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-heading font-bold text-xl text-accent">
                        {formatMockPrice(product.price, product.currency)}
                      </p>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-9 w-9 p-0 hover:bg-accent/10 hover:text-accent"
                        onClick={(e) => handleAddMockToCart(product, e)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && !hasShopifyProducts && filteredMockProducts.length === 0 && (
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
