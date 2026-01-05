import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Sparkles, Tag, Cog, Car, Flower2, Puzzle, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

// LEGO-style bright colors for categories with glow colors for hover
const categoryStyles: Record<string, { bg: string; hover: string; icon: React.ElementType; glow: string }> = {
  varikliai: { bg: "bg-red-500", hover: "hover:bg-red-600", icon: Cog, glow: "rgba(239, 68, 68, 0.5)" },
  automobiliai: { bg: "bg-blue-500", hover: "hover:bg-blue-600", icon: Car, glow: "rgba(59, 130, 246, 0.5)" },
  geles: { bg: "bg-pink-500", hover: "hover:bg-pink-600", icon: Flower2, glow: "rgba(236, 72, 153, 0.5)" },
  konstruktoriai: { bg: "bg-green-500", hover: "hover:bg-green-600", icon: Puzzle, glow: "rgba(34, 197, 94, 0.5)" },
  visi: { bg: "bg-yellow-400", hover: "hover:bg-yellow-500", icon: Sparkles, glow: "rgba(250, 204, 21, 0.5)" },
  pasiulymai: { bg: "bg-orange-500", hover: "hover:bg-orange-600", icon: Tag, glow: "rgba(249, 115, 22, 0.5)" },
  "dovanu-kuponai": { bg: "bg-purple-500", hover: "hover:bg-purple-600", icon: Gift, glow: "rgba(168, 85, 247, 0.5)" },
};

const defaultStyle = { bg: "bg-indigo-500", hover: "hover:bg-indigo-600", icon: Puzzle, glow: "rgba(99, 102, 241, 0.5)" };

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
    style: { bg: string; hover: string; icon: React.ElementType; glow: string };
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
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {allTiles.map((tile, index) => {
            const IconComponent = tile.style.icon;
            const linkUrl = tile.slug === 'pasiulymai' 
              ? '/produktai/visi?offers=true' 
              : `/produktai/${tile.slug}`;
            
            return (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.05,
                  duration: 0.3,
                  ease: "easeOut"
                }}
              >
                <Link
                  to={linkUrl}
                  className="block"
                >
                  <motion.div
                    className={cn(
                      "relative flex flex-col items-center justify-center p-5 md:p-6 rounded-2xl text-white transition-shadow duration-300",
                      tile.style.bg
                    )}
                    whileHover={{ 
                      scale: 1.08,
                      y: -4,
                      boxShadow: `0 12px 28px -8px ${tile.style.glow}`,
                      transition: { 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 17 
                      }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      whileHover={{ 
                        rotate: [0, -10, 10, -5, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      <IconComponent className="w-8 h-8 md:w-10 md:h-10 mb-3 opacity-90" strokeWidth={1.5} />
                    </motion.div>
                    <span className="font-bold text-sm md:text-base text-center leading-tight">
                      {tile.name}
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
