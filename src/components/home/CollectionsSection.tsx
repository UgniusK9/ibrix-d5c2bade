import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Sparkles, Tag, Cog, Car, Flower2, Puzzle, Gift, ArrowRight, LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CategoryCard } from "./CategoryCard";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

// Category configuration with accent colors and icons
const categoryConfig: Record<string, { icon: LucideIcon; accentColor: string; subtitle?: string }> = {
  visi: { icon: Sparkles, accentColor: "bg-amber-400", subtitle: "Naujausi produktai" },
  pasiulymai: { icon: Tag, accentColor: "bg-orange-500", subtitle: "Specialūs pasiūlymai" },
  varikliai: { icon: Cog, accentColor: "bg-red-500", subtitle: "Mechaniniai modeliai" },
  automobiliai: { icon: Car, accentColor: "bg-blue-500", subtitle: "Transporto modeliai" },
  geles: { icon: Flower2, accentColor: "bg-pink-500", subtitle: "Gėlių kolekcija" },
  konstruktoriai: { icon: Puzzle, accentColor: "bg-green-500", subtitle: "Visi rinkiniai" },
  "dovanu-kuponai": { icon: Gift, accentColor: "bg-purple-500", subtitle: "Dovanokite džiaugsmą" },
};

const defaultConfig: { icon: LucideIcon; accentColor: string; subtitle?: string } = { 
  icon: Puzzle, 
  accentColor: "bg-primary", 
  subtitle: undefined 
};

export function CollectionsSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, description, image_url')
          .eq('active', true)
          .order('sort_order')
          .limit(10);
        
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

  if (loading) {
    return (
      <section className="py-10 md:py-12 bg-background">
        <div className="container flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  // Build category tiles with special ones first
  const allTiles = [
    { id: 'all', name: 'Naujienos', slug: 'visi', config: categoryConfig.visi },
    { id: 'offers', name: 'Pasiūlymai', slug: 'pasiulymai', config: categoryConfig.pasiulymai },
    ...categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      config: categoryConfig[c.slug] || defaultConfig,
    })),
  ];

  return (
    <section className="py-10 md:py-12 bg-background">
      <div className="container">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            Naršyk pagal kategoriją
          </h2>
          <Link
            to="/produktai/visi"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            Visos kategorijos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {/* Category grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {allTiles.slice(0, 8).map((tile) => {
            const linkUrl = tile.slug === 'pasiulymai' 
              ? '/produktai/visi?offers=true' 
              : `/produktai/${tile.slug}`;
            
            return (
              <CategoryCard
                key={tile.id}
                title={tile.name}
                subtitle={tile.config.subtitle}
                icon={tile.config.icon}
                href={linkUrl}
                accentColorClass={tile.config.accentColor}
              />
            );
          })}
        </div>

        {/* Mobile "View all" link */}
        <div className="mt-4 sm:hidden">
          <Link
            to="/produktai/visi"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            Visos kategorijos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
