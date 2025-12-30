import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Package, Clock, ShoppingCart, Filter } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockProducts, MockProduct, formatMockPrice } from "@/data/mockProducts";
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [partsFilter, setPartsFilter] = useState<PartsFilter>("all");
  const addItem = useCartStore((state) => state.addItem);

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (partsFilter === "under-1500" && p.detailsCount >= 1500) return false;
      if (partsFilter === "1500-2500" && (p.detailsCount < 1500 || p.detailsCount > 2500)) return false;
      if (partsFilter === "over-2500" && p.detailsCount <= 2500) return false;
      return true;
    });
  }, [statusFilter, partsFilter]);

  const handleAddToCart = (product: MockProduct, e: React.MouseEvent) => {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
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
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredProducts.length === 0 && (
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
