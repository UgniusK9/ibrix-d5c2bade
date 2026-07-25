import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight, Grid3X3, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { buildCategoryTree, topLevelCategories, type CategoryNode as TreeNode } from "@/lib/categoryTree";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
}

type CategoryNode = TreeNode<Category>;

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
          .select('id, name, slug, description, image_url, parent_id')
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

  // Top-level menu entries: children of the single root category (e.g. "Konstruktoriai"),
  // so the root itself never shows up as a tile alongside its own children.
  const topLevel = useMemo(() => topLevelCategories(buildCategoryTree(categories)), [categories]);

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
        <div className="absolute top-full left-0 mt-2 w-[1080px] max-w-[95vw] bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
          <div className="grid grid-cols-[200px_1fr] divide-x divide-border">
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

            {/* Right column - every category, fully expanded */}
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : topLevel.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">
                  Nėra kategorijų
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-x-6 gap-y-6">
                  {topLevel.map((category) => (
                    <CategoryColumn key={category.id} node={category} onNavigate={handleLinkClick} />
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

// A mega-menu column: a linked top-level category header plus its full,
// recursively nested subtree — always expanded, no hover/click needed.
function CategoryColumn({ node, onNavigate }: { node: CategoryNode; onNavigate: () => void }) {
  return (
    <div className="min-w-0">
      <Link
        to={`/produktai/${node.slug}`}
        onClick={onNavigate}
        className="text-sm font-semibold text-foreground hover:text-primary transition-colors block mb-2 truncate"
      >
        {node.name}
      </Link>
      <CategoryLeafList nodes={node.children} onNavigate={onNavigate} />
    </div>
  );
}

// Renders a category's children as a list, recursing into grandchildren (and beyond)
// with progressively lighter styling, so the menu scales to any depth of nesting.
function CategoryLeafList({
  nodes,
  onNavigate,
  depth = 0,
}: {
  nodes: CategoryNode[];
  onNavigate: () => void;
  depth?: number;
}) {
  if (nodes.length === 0) return null;
  return (
    <ul className={cn("space-y-1.5", depth > 0 && "ml-3 mt-1 space-y-1 border-l border-border pl-2")}>
      {nodes.map((node) => (
        <li key={node.id}>
          <Link
            to={`/produktai/${node.slug}`}
            onClick={onNavigate}
            className={cn(
              "text-muted-foreground hover:text-primary transition-colors block truncate",
              depth === 0 ? "text-sm" : "text-xs"
            )}
          >
            {node.name}
          </Link>
          <CategoryLeafList nodes={node.children} onNavigate={onNavigate} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}
