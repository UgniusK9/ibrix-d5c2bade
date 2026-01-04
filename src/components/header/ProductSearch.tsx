import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts, formatPrice, getProductImage } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface ProductSearchProps {
  className?: string;
  onClose?: () => void;
  isMobile?: boolean;
}

export function ProductSearch({ className, onClose, isMobile }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data: products, isLoading } = useProducts();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter products based on query
  const filteredProducts = products?.filter(p => 
    query.length >= 2 && (
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()) ||
      p.short_desc?.toLowerCase().includes(query.toLowerCase())
    )
  ).slice(0, 5) || [];

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
    } else if (e.key === "Enter" && query.length >= 2) {
      navigate(`/produktai/visi?search=${encodeURIComponent(query)}`);
      setIsOpen(false);
      onClose?.();
    }
  };

  const handleProductClick = () => {
    setQuery("");
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Ieškoti produktų..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length >= 2);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-10 pr-10 h-10 bg-secondary/50 border-border focus:border-primary focus:bg-background transition-colors",
            isMobile ? "w-full" : "w-[200px] lg:w-[280px] focus:w-[320px]"
          )}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nieko nerasta pagal „{query}"
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/produktas/${product.slug}`}
                    onClick={handleProductClick}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                      <img 
                        src={getProductImage(product)} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-semibold text-accent">
                          {formatPrice(product.price_eur)}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {product.stock_status === 'preorder' ? 'Pre-order' : 'Sandėlyje'}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
              <Link
                to={`/produktai/visi?search=${encodeURIComponent(query)}`}
                onClick={handleProductClick}
                className="flex items-center justify-center gap-2 p-3 bg-muted/30 text-sm text-primary hover:bg-muted/50 transition-colors"
              >
                Visi rezultatai „{query}"
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
