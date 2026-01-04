import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

// Fallback images for categories
const categoryImages: Record<string, string> = {
  varikliai: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
  automobiliai: "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=600&h=400&fit=crop",
  geles: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&h=400&fit=crop",
  konstruktoriai: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&h=400&fit=crop",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
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
          .limit(8);
        
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
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container">
        {/* Section tabs */}
        <div className="flex items-center gap-6 border-b border-border mb-8">
          <button className="pb-3 border-b-2 border-primary text-foreground font-semibold">
            Kategorijos
          </button>
          <Link to="/produktai/visi" className="pb-3 text-muted-foreground hover:text-foreground transition-colors">
            Visi produktai
          </Link>
        </div>

        {/* Categories Grid - LEGO style tiles */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          {categories.map((category, index) => {
            const imageUrl = category.image_url || categoryImages[category.slug] || categoryImages.konstruktoriai;
            
            return (
              <motion.div key={category.id} variants={item}>
                <Link
                  to={`/produktai/${category.slug}`}
                  className="group relative block rounded-2xl overflow-hidden aspect-[4/5] bg-card border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
                >
                  {/* Image */}
                  <div className="absolute inset-0">
                    <img 
                      src={imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-heading font-bold text-lg text-white mb-1 group-hover:text-accent transition-colors">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-white/70 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All */}
        <div className="text-center mt-10">
          <Link
            to="/produktai/visi"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
          >
            Žiūrėti visus produktus
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}