import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

// Default category images as fallback
const categoryImages: Record<string, string> = {
  varikliai: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
  automobiliai: "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=400&h=400&fit=crop",
  geles: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop",
  konstruktoriai: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop",
};

// Tabs for filtering
const tabs = [
  { id: "all", name: "Naujienos" },
  { id: "popular", name: "Populiariausi" },
  { id: "themes", name: "Temos" },
];

export function CollectionsSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

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
      <section className="py-12 bg-primary">
        <div className="container flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
        </div>
      </section>
    );
  }

  // Add special tiles
  const allTiles: Array<{
    type: 'link' | 'promo' | 'category';
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    isHighlight?: boolean;
    isPromo?: boolean;
  }> = [
    { type: 'link', id: 'all', name: 'Visi nauji rinkiniai', slug: 'visi', image_url: null, isHighlight: true },
    { type: 'promo', id: 'offers', name: 'Pasiūlymai', slug: 'pasiulymai', image_url: null, isPromo: true },
    ...categories.map(c => ({ ...c, type: 'category' as const })),
  ];

  return (
    <section className="py-8 bg-primary">
      <div className="container">
        {/* Tabs */}
        <div className="flex items-center gap-6 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-sm font-medium transition-colors pb-1",
                activeTab === tab.id
                  ? "text-primary-foreground border-b-2 border-primary-foreground"
                  : "text-primary-foreground/60 hover:text-primary-foreground"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Horizontal scrolling category tiles - LEGO style */}
        <div className="relative -mx-4 px-4">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {allTiles.map((tile, index) => {
              const imageUrl = tile.image_url || categoryImages[tile.slug] || categoryImages.konstruktoriai;
              
              if (tile.type === 'promo') {
                return (
                  <Link
                    key={tile.id}
                    to="/produktai/visi?offers=true"
                    className="flex-shrink-0 snap-start group"
                  >
                    <div className="w-28 md:w-32">
                      <div className="aspect-square rounded-xl bg-accent flex items-center justify-center overflow-hidden mb-2 group-hover:shadow-lg transition-shadow">
                        <div className="text-accent-foreground font-bold text-4xl">
                          <Percent className="w-12 h-12" />
                        </div>
                      </div>
                      <p className="text-xs md:text-sm font-medium text-primary-foreground text-center line-clamp-2">
                        {tile.name}
                      </p>
                    </div>
                  </Link>
                );
              }
              
              return (
                <Link
                  key={tile.id}
                  to={`/produktai/${tile.slug}`}
                  className="flex-shrink-0 snap-start group"
                >
                  <div className="w-28 md:w-32">
                    <div 
                      className={cn(
                        "aspect-square rounded-xl overflow-hidden mb-2 group-hover:shadow-lg transition-all duration-300",
                        tile.isHighlight && "ring-2 ring-accent ring-offset-2 ring-offset-primary"
                      )}
                    >
                      <img 
                        src={imageUrl}
                        alt={tile.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <p className={cn(
                      "text-xs md:text-sm font-medium text-center line-clamp-2",
                      tile.isHighlight ? "text-accent" : "text-primary-foreground"
                    )}>
                      {tile.name}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}