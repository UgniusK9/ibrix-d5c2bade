import { useState, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Package, Clock, ShoppingCart, Filter, Loader2, Grid3X3, LayoutGrid, ChevronRight } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts, formatPrice, getEtaString, getProductImage, Product } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "preorder" | "in_stock";

const categoryConfig: Record<string, { title: string; description: string; slug: string }> = {
  engines: { 
    title: "Varikliai", 
    description: "Mechaninių konstruktorių kolekcija su realiai judančiais mechanizmais.",
    slug: "varikliai"
  },
  cars: { 
    title: "Automobilių modeliai", 
    description: "Detalūs automobilių modeliai kolekcijoms ir entuziastams.",
    slug: "automobiliai"
  },
  flowers: { 
    title: "Gėlių rinkiniai", 
    description: "Unikalūs gėlių konstruktoriai ir dekoracijos.",
    slug: "geles"
  },
  other: { 
    title: "Kiti produktai", 
    description: "Kiti unikalūs konstruktoriai ir priedai.",
    slug: "kita"
  },
  all: {
    title: "Visi produktai",
    description: "Peržiūrėkite visą mūsų produktų katalogą.",
    slug: "visi"
  }
};

// Reverse lookup: slug -> category key
const slugToCategory: Record<string, string> = {
  varikliai: "engines",
  automobiliai: "cars",
  geles: "flowers",
  kita: "other",
  visi: "all"
};

export default function Produktai() {
  const { category: categorySlug } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const addItem = useCartStore((state) => state.addItem);
  const { data: products, isLoading, error } = useProducts();

  // Determine category from URL
  const categoryKey = categorySlug ? slugToCategory[categorySlug] || 'all' : 'all';
  const currentCategory = categoryConfig[categoryKey] || categoryConfig.all;

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      // Filter by category
      if (categoryKey !== 'all' && p.category !== categoryKey) return false;
      // Filter by stock status
      if (statusFilter !== "all" && p.stock_status !== statusFilter) return false;
      return true;
    });
  }, [products, categoryKey, statusFilter]);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  // Get category counts
  const categoryCounts = useMemo(() => {
    if (!products) return {};
    const counts: Record<string, number> = { all: products.length };
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <PageLayout>
      <SEOHead 
        title={`${currentCategory.title} | Ibrix.lt`}
        description={currentCategory.description}
        canonical={`https://ibrix.lt/produktai/${categoryConfig[categoryKey]?.slug || ''}`}
      />
      
      <section className="py-8 md:py-12">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Pradžia</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/produktai/visi" className="hover:text-foreground transition-colors">Produktai</Link>
            {categoryKey !== 'all' && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground font-medium">{currentCategory.title}</span>
              </>
            )}
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              {currentCategory.title}
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              {currentCategory.description}
            </p>
          </div>

          <div className="grid lg:grid-cols-[240px_1fr] gap-8">
            {/* Sidebar - Categories */}
            <aside className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-heading font-semibold mb-4">Kategorijos</h3>
                <nav className="space-y-1">
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <Link
                      key={key}
                      to={`/produktai/${config.slug}`}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                        categoryKey === key 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{config.title}</span>
                      {categoryCounts[key] !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          {categoryCounts[key]}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Mobile-hidden stock filter */}
              <div className="hidden lg:block bg-card rounded-xl border border-border p-4">
                <h3 className="font-heading font-semibold mb-4">Prieinamumas</h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'Visi' },
                    { value: 'in_stock', label: 'Sandėlyje' },
                    { value: 'preorder', label: 'Pre-order' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value as StatusFilter)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        statusFilter === option.value
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-4">
                  {/* Mobile filter */}
                  <div className="flex items-center gap-2 lg:hidden">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Statusas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Visi</SelectItem>
                        <SelectItem value="preorder">Pre-order</SelectItem>
                        <SelectItem value="in_stock">Sandėlyje</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <span className="text-sm text-muted-foreground">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'produktas' : 'produktai'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setViewMode('compact')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-16">
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
                <div className={cn(
                  "grid gap-4",
                  viewMode === 'grid' 
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" 
                    : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                )}>
                  {filteredProducts.map((product) => {
                    const isPreOrder = product.stock_status === 'preorder';
                    const eta = getEtaString(product);
                    const image = getProductImage(product);
                    const detailsCount = (product.details_json as Record<string, unknown>)?.detailsCount as number || 0;
                    
                    return (
                      <Link
                        key={product.id}
                        to={`/produktas/${product.slug}`}
                        className="group block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
                      >
                        <div className="relative aspect-square bg-secondary/30 overflow-hidden">
                          <img
                            src={image}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <Badge className={cn(
                            "absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5",
                            isPreOrder ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"
                          )}>
                            {isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
                          </Badge>
                        </div>
                        <div className={cn("p-3", viewMode === 'grid' ? 'p-4' : 'p-3')}>
                          {viewMode === 'grid' && (
                            <p className="text-xs text-muted-foreground font-mono mb-1">
                              {product.sku}
                            </p>
                          )}
                          <h3 className={cn(
                            "font-heading font-semibold line-clamp-2 group-hover:text-primary transition-colors",
                            viewMode === 'grid' ? "text-sm mb-2" : "text-xs mb-1.5"
                          )}>
                            {product.title}
                          </h3>
                          {viewMode === 'grid' && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                              {detailsCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {detailsCount}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {eta}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <p className={cn(
                              "font-heading font-bold text-accent",
                              viewMode === 'grid' ? "text-lg" : "text-sm"
                            )}>
                              {formatPrice(product.price_eur)}
                            </p>
                            {viewMode === 'grid' && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-accent/10 hover:text-accent"
                                onClick={(e) => handleAddToCart(product, e)}
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && filteredProducts.length === 0 && (
                <div className="bg-card rounded-xl p-12 text-center border border-border">
                  <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
                  <h3 className="font-heading text-xl font-semibold mb-2">
                    Produktų nerasta
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Pagal pasirinktus filtrus produktų nerasta.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/produktai/visi">Peržiūrėti visus</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}