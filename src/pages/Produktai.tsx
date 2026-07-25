import { useState, useMemo, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, Clock, ShoppingCart, Filter, Loader2, Grid3X3, LayoutGrid, ChevronRight, ChevronDown, Eye, ArrowUpDown } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts, formatPrice, getEtaString, getProductImage, Product } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { QuickViewModal } from "@/components/products/QuickViewModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { buildCategoryTree, topLevelCategories, findAncestorIds, type CategoryNode } from "@/lib/categoryTree";

type StatusFilter = "all" | "preorder" | "in_stock";
type SortOption = "recommended" | "newest" | "price_asc" | "price_desc" | "parts" | "name_asc";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  active: boolean;
}

// Special category slugs for virtual categories
const SPECIAL_CATEGORIES = {
  'dovanu-kuponai': { name: 'Dovanų kuponai', description: 'Dovanų kuponai artimiesiems' },
  'pasiulymai': { name: 'Pasiūlymai ir išpardavimai', description: 'Specialūs pasiūlymai ir nuolaidos' },
  'naujienos': { name: 'Naujienos', description: 'Naujausi produktai mūsų parduotuvėje' },
  'populiariausi': { name: 'Populiariausi', description: 'Populiariausi konstruktoriai pagal pirkėjų pasirinkimą' },
};

export default function Produktai() {
  const { category: categorySlug } = useParams<{ category?: string }>();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const { data: products, isLoading, error } = useProducts();

  // Load categories from DB
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, description, parent_id, active')
          .eq('active', true)
          .order('sort_order');

        if (error) throw error;
        setCategories(data || []);
      } catch (e) {
        console.error('Failed to load categories:', e);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Handle URL params for stock filter
  useEffect(() => {
    if (categorySlug === 'preorder') {
      setStatusFilter('preorder');
    } else if (categorySlug === 'sandelyje') {
      setStatusFilter('in_stock');
    }
  }, [categorySlug]);

  // Determine current category from URL
  const currentCategory = useMemo(() => {
    if (!categorySlug || categorySlug === 'visi') {
      return { id: 'all', name: 'Visi konstruktoriai', slug: 'visi', description: 'Peržiūrėkite visą mūsų konstruktorių katalogą.' };
    }
    
    // Check special categories
    if (categorySlug in SPECIAL_CATEGORIES) {
      const special = SPECIAL_CATEGORIES[categorySlug as keyof typeof SPECIAL_CATEGORIES];
      return { id: categorySlug, name: special.name, slug: categorySlug, description: special.description };
    }
    
    // Check stock filter slugs
    if (categorySlug === 'preorder') {
      return { id: 'preorder', name: 'Pre-order', slug: 'preorder', description: 'Konstruktoriai, kuriuos galite užsisakyti iš anksto.' };
    }
    if (categorySlug === 'sandelyje') {
      return { id: 'sandelyje', name: 'Sandėlyje', slug: 'sandelyje', description: 'Konstruktoriai, kurie yra mūsų sandėlyje ir paruošti siuntimui.' };
    }
    
    const found = categories.find(c => c.slug === categorySlug);
    if (found) {
      return { ...found, description: found.description || `${found.name} kolekcija` };
    }
    // Fallback for legacy enum categories
    const legacyMap: Record<string, { name: string; description: string }> = {
      varikliai: { name: 'Varikliai', description: 'Mechaninių konstruktorių kolekcija su realiai judančiais mechanizmais.' },
      automobiliai: { name: 'Automobilių modeliai', description: 'Detalūs automobilių modeliai kolekcijoms ir entuziastams.' },
      geles: { name: 'Gėlių rinkiniai', description: 'Unikalūs gėlių konstruktoriai ir dekoracijos.' },
      kita: { name: 'Kiti produktai', description: 'Kiti unikalūs konstruktoriai ir priedai.' },
    };
    const legacy = legacyMap[categorySlug];
    if (legacy) {
      return { id: categorySlug, name: legacy.name, slug: categorySlug, description: legacy.description };
    }
    return { id: 'all', name: 'Visi konstruktoriai', slug: 'visi', description: 'Peržiūrėkite visą mūsų konstruktorių katalogą.' };
  }, [categorySlug, categories]);

  // Auto-expand the sidebar tree down to (and including) the active category
  useEffect(() => {
    if (currentCategory.id === 'all' || categories.length === 0) return;
    const idsToExpand = findAncestorIds(categories, currentCategory.id);
    idsToExpand.add(currentCategory.id);
    setExpandedCategoryIds((prev) => new Set([...prev, ...idsToExpand]));
  }, [currentCategory.id, categories]);

  const categoryTree = useMemo(
    () => topLevelCategories(buildCategoryTree(categories)),
    [categories]
  );

  const toggleCategoryExpanded = (id: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = products.filter((p) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          p.title.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.short_desc?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Special category filters
      if (categorySlug === 'naujienos') {
        const badges = p.badges || [];
        return badges.includes('new');
      }
      if (categorySlug === 'populiariausi') {
        const badges = p.badges || [];
        return badges.includes('popular');
      }
      if (categorySlug === 'pasiulymai') {
        return p.sale_price_eur !== null && p.sale_price_eur !== undefined;
      }
      if (categorySlug === 'dovanu-kuponai') {
        // Show gift card related products (if any tagged)
        const tags = p.tags || [];
        return tags.includes('dovanu-kuponas') || tags.includes('gift-card');
      }
      
      // Stock status filter from URL or sidebar
      if (categorySlug === 'preorder' || (statusFilter === 'preorder' && categorySlug !== 'sandelyje')) {
        if (p.stock_status !== 'preorder') return false;
      } else if (categorySlug === 'sandelyje' || (statusFilter === 'in_stock' && categorySlug !== 'preorder')) {
        if (p.stock_status !== 'in_stock') return false;
      } else if (statusFilter !== "all" && !['preorder', 'sandelyje'].includes(categorySlug || '')) {
        if (p.stock_status !== statusFilter) return false;
      }
      
      // Category filter (skip for special categories)
      if (currentCategory.id !== 'all' && !['preorder', 'sandelyje', 'naujienos', 'populiariausi', 'pasiulymai', 'dovanu-kuponai'].includes(currentCategory.id)) {
        // Check category_id first (DB category)
        const matchesCategoryId = categories.find(c => c.slug === categorySlug)?.id === p.category_id;
        // Fallback to legacy enum category
        const legacySlugToEnum: Record<string, string> = {
          varikliai: 'engines',
          automobiliai: 'cars',
          geles: 'flowers',
          kita: 'other',
        };
        const matchesLegacy = legacySlugToEnum[categorySlug || ''] === p.category;
        
        if (!matchesCategoryId && !matchesLegacy) return false;
      }
      
      return true;
    });
    
    // Sort products
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price_asc':
          return (a.sale_price_eur || a.price_eur) - (b.sale_price_eur || b.price_eur);
        case 'price_desc':
          return (b.sale_price_eur || b.price_eur) - (a.sale_price_eur || a.price_eur);
        case 'parts':
          const aParts = (a.details_json as Record<string, unknown>)?.detailsCount as number || 0;
          const bParts = (b.details_json as Record<string, unknown>)?.detailsCount as number || 0;
          return bParts - aParts;
        case 'name_asc':
          return a.title.localeCompare(b.title, 'lt');
        case 'recommended':
        default:
          // Prioritize popular badge, then new, then by creation date
          const aPopular = (a.badges || []).includes('popular') ? 1 : 0;
          const bPopular = (b.badges || []).includes('popular') ? 1 : 0;
          if (aPopular !== bPopular) return bPopular - aPopular;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [products, currentCategory, categorySlug, categories, statusFilter, searchQuery, sortBy]);

  const handleQuickView = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  // Get category counts
  const categoryCounts = useMemo(() => {
    if (!products) return {};
    const counts: Record<string, number> = { all: products.length };
    
    // Count by DB category_id
    categories.forEach(cat => {
      counts[cat.id] = products.filter(p => p.category_id === cat.id).length;
    });
    
    // Count special categories
    counts['preorder'] = products.filter(p => p.stock_status === 'preorder').length;
    counts['sandelyje'] = products.filter(p => p.stock_status === 'in_stock').length;
    counts['naujienos'] = products.filter(p => (p.badges || []).includes('new')).length;
    counts['populiariausi'] = products.filter(p => (p.badges || []).includes('popular')).length;
    counts['pasiulymai'] = products.filter(p => p.sale_price_eur !== null && p.sale_price_eur !== undefined).length;
    counts['dovanu-kuponai'] = products.filter(p => (p.tags || []).includes('dovanu-kuponas') || (p.tags || []).includes('gift-card')).length;
    
    // Also count legacy categories
    const legacyEnums = ['engines', 'cars', 'flowers', 'other'];
    legacyEnums.forEach(e => {
      if (!counts[e]) {
        counts[e] = products.filter(p => p.category === e && !p.category_id).length;
      }
    });
    
    return counts;
  }, [products, categories]);

  // Special virtual categories shown below the DB category tree
  const specialNavItems = useMemo(() => ([
    { id: 'dovanu-kuponai', name: 'Dovanų kuponai', slug: 'dovanu-kuponai', count: categoryCounts['dovanu-kuponai'] || 0 },
    { id: 'pasiulymai', name: 'Pasiūlymai ir išpardavimai', slug: 'pasiulymai', count: categoryCounts['pasiulymai'] || 0 },
    { id: 'naujienos', name: 'Naujienos', slug: 'naujienos', count: categoryCounts['naujienos'] || 0 },
  ]), [categoryCounts]);

  return (
    <PageLayout>
      <SEOHead 
        title={`${currentCategory.name} | Ibrix.lt`}
        description={currentCategory.description || ''}
        canonical={`https://ibrix.lt/produktai/${currentCategory.slug}`}
      />
      
      <section className="py-8 md:py-12">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Pradžia</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/produktai/visi" className="hover:text-foreground transition-colors">Konstruktoriai</Link>
            {currentCategory.id !== 'all' && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground font-medium">{currentCategory.name}</span>
              </>
            )}
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              {currentCategory.name}
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
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <nav className="space-y-1">
                    <Link
                      to="/produktai/visi"
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                        currentCategory.id === 'all'
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>Visi konstruktoriai</span>
                      {(categoryCounts['all'] || 0) > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {categoryCounts['all']}
                        </Badge>
                      )}
                    </Link>

                    <CategorySidebarTree
                      nodes={categoryTree}
                      activeSlug={currentCategory.slug}
                      expandedIds={expandedCategoryIds}
                      onToggle={toggleCategoryExpanded}
                      counts={categoryCounts}
                    />

                    {specialNavItems.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/produktai/${cat.slug}`}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                          currentCategory.slug === cat.slug
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>{cat.name}</span>
                        {cat.count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {cat.count}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </nav>
                )}
              </div>

              {/* Stock filter */}
              <div className="hidden lg:block bg-card rounded-xl border border-border p-4">
                <h3 className="font-heading font-semibold mb-4">Prieinamumas</h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'Visi', slug: 'visi' },
                    { value: 'in_stock', label: 'Sandėlyje', slug: 'sandelyje' },
                    { value: 'preorder', label: 'Pre-order', slug: 'preorder' },
                  ].map((option) => (
                    <Link
                      key={option.value}
                      to={`/produktai/${option.slug}`}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors block",
                        (categorySlug === option.slug || (option.value === 'all' && categorySlug === 'visi'))
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {option.label}
                      {categoryCounts[option.value === 'all' ? 'all' : option.value === 'in_stock' ? 'sandelyje' : 'preorder'] > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {categoryCounts[option.value === 'all' ? 'all' : option.value === 'in_stock' ? 'sandelyje' : 'preorder']}
                        </Badge>
                      )}
                    </Link>
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
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'konstruktorius' : 'konstruktoriai'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sort dropdown */}
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="w-[180px]">
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Rūšiuoti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommended">Perkamiausi</SelectItem>
                      <SelectItem value="newest">Naujausi</SelectItem>
                      <SelectItem value="price_asc">Kaina: nuo žemiausios</SelectItem>
                      <SelectItem value="price_desc">Kaina: nuo aukščiausios</SelectItem>
                      <SelectItem value="parts">Dalių skaičius</SelectItem>
                      <SelectItem value="name_asc">A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                  
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
                          {/* Quick view button on hover */}
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute top-2 right-2 h-8 w-8 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleQuickView(product, e)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                            <div>
                              {product.sale_price_eur ? (
                                <div className="flex items-center gap-2">
                                  <p className={cn(
                                    "font-heading font-bold text-accent",
                                    viewMode === 'grid' ? "text-lg" : "text-sm"
                                  )}>
                                    {formatPrice(product.sale_price_eur)}
                                  </p>
                                  <p className={cn(
                                    "text-muted-foreground line-through",
                                    viewMode === 'grid' ? "text-sm" : "text-xs"
                                  )}>
                                    {formatPrice(product.price_eur)}
                                  </p>
                                </div>
                              ) : (
                                <p className={cn(
                                  "font-heading font-bold text-accent",
                                  viewMode === 'grid' ? "text-lg" : "text-sm"
                                )}>
                                  {formatPrice(product.price_eur)}
                                </p>
                              )}
                            </div>
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

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        open={!!quickViewProduct}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
      />
    </PageLayout>
  );
}

// Recursive, expandable category tree for the sidebar filter — mirrors the
// mega-menu's tree, but as a collapsible vertical list with per-node counts.
function CategorySidebarTree({
  nodes,
  activeSlug,
  expandedIds,
  onToggle,
  counts,
  depth = 0,
}: {
  nodes: CategoryNode<Category>[];
  activeSlug: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  counts: Record<string, number>;
  depth?: number;
}) {
  if (nodes.length === 0) return null;
  return (
    <ul className={cn(depth > 0 && "ml-3 mt-0.5 space-y-1 border-l border-border pl-3")}>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);
        const isActive = activeSlug === node.slug;
        const count = counts[node.id] || 0;
        return (
          <li key={node.id}>
            <div
              className={cn(
                "flex items-center rounded-lg text-sm transition-colors",
                isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Link
                to={`/produktai/${node.slug}`}
                className="flex-1 flex items-center justify-between gap-2 px-3 py-2 min-w-0"
              >
                <span className="truncate">{node.name}</span>
                {count > 0 && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {count}
                  </Badge>
                )}
              </Link>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => onToggle(node.id)}
                  className="px-2 py-2 flex-shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={isExpanded ? "Suskleisti kategoriją" : "Išskleisti kategoriją"}
                >
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
                </button>
              )}
            </div>
            {hasChildren && isExpanded && (
              <CategorySidebarTree
                nodes={node.children}
                activeSlug={activeSlug}
                expandedIds={expandedIds}
                onToggle={onToggle}
                counts={counts}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
