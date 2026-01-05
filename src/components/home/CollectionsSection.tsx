import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Sparkles, Tag, Cog, Car, Flower2, Puzzle, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

// LEGO-style bright colors for categories
const categoryStyles: Record<string, { bg: string; hover: string; icon: React.ElementType }> = {
  varikliai: { bg: "bg-red-500", hover: "hover:bg-red-600", icon: Cog },
  automobiliai: { bg: "bg-blue-500", hover: "hover:bg-blue-600", icon: Car },
  geles: { bg: "bg-pink-500", hover: "hover:bg-pink-600", icon: Flower2 },
  konstruktoriai: { bg: "bg-green-500", hover: "hover:bg-green-600", icon: Puzzle },
  visi: { bg: "bg-yellow-400", hover: "hover:bg-yellow-500", icon: Sparkles },
  pasiulymai: { bg: "bg-orange-500", hover: "hover:bg-orange-600", icon: Tag },
  "dovanu-kuponai": { bg: "bg-purple-500", hover: "hover:bg-purple-600", icon: Gift },
};

const defaultStyle = { bg: "bg-indigo-500", hover: "hover:bg-indigo-600", icon: Puzzle };

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
      <section className="py-12 bg-white">
        <div className="container flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  // Build category tiles with special ones first
  const allTiles: Array<{
    id: string;
    name: string;
    slug: string;
    style: { bg: string; hover: string; icon: React.ElementType };
  }> = [
    { id: 'all', name: 'Naujienos', slug: 'visi', style: categoryStyles.visi },
    { id: 'offers', name: 'Pasiūlymai', slug: 'pasiulymai', style: categoryStyles.pasiulymai },
    ...categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      style: categoryStyles[c.slug] || defaultStyle,
    })),
  ];

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-8">
          Naršyk pagal kategoriją
        </h2>
        
        {/* Category cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {allTiles.map((tile) => {
            const IconComponent = tile.style.icon;
            const linkUrl = tile.slug === 'pasiulymai' 
              ? '/produktai/visi?offers=true' 
              : `/produktai/${tile.slug}`;
            
            return (
              <Link
                key={tile.id}
                to={linkUrl}
                className={cn(
                  "group relative flex flex-col items-center justify-center p-5 md:p-6 rounded-2xl text-white transition-all duration-200",
                  tile.style.bg,
                  tile.style.hover,
                  "hover:scale-105 hover:shadow-lg"
                )}
              >
                <IconComponent className="w-8 h-8 md:w-10 md:h-10 mb-3 opacity-90" strokeWidth={1.5} />
                <span className="font-bold text-sm md:text-base text-center leading-tight">
                  {tile.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
