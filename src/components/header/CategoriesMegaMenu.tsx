import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight, Grid3X3, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

const quickLinks = [
  { name: "Visi konstruktoriai", href: "/produktai/visi", highlight: true },
  { name: "Naujienos", href: "/produktai/naujienos" },
  { name: "Populiariausi", href: "/produktai/populiariausi" },
  { name: "Pre-order", href: "/produktai/preorder" },
  { name: "Sandėlyje", href: "/produktai/sandelyje" },
];

interface CategoriesMegaMenuProps {
  onNavigate?: () => void;
}

export function CategoriesMegaMenu({ onNavigate }: CategoriesMegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, description, image_url')
          .eq('active', true)
          .order('sort_order');
        
        if (error) throw error;
        setCategories(data || []);
      } catch (e) {
        console.error('Failed to load categories:', e);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
    onNavigate?.();
  };

  return (
    <div 
      ref={menuRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <button
        className={cn(
          "flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
          isOpen
            ? "text-primary bg-primary/5"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        Konstruktoriai
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Mega Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[600px] bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
          <div className="grid grid-cols-[180px_1fr] divide-x divide-border">
            {/* Left column - Quick links */}
            <div className="p-4 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Peržiūrėti
              </p>
              <nav className="space-y-1">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      link.highlight 
                        ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <span>{link.name}</span>
                    {link.highlight && <ArrowRight className="w-4 h-4" />}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right column - Categories */}
            <div className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Kategorijos
              </p>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">
                  Nėra kategorijų
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/produktai/${category.slug}`}
                      onClick={handleLinkClick}
                      className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      {/* Category image */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
                        {category.image_url ? (
                          <img 
                            src={category.image_url}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Grid3X3 className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-muted/30 border-t border-border">
            <Link
              to="/produktai/visi"
              onClick={handleLinkClick}
              className="flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline"
            >
              <Grid3X3 className="w-4 h-4" />
              Peržiūrėti visus konstruktorius
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
