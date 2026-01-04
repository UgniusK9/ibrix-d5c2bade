import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  background_color: string;
  link_url: string;
  link_text: string;
  secondary_link_url: string | null;
  secondary_link_text: string | null;
  badge_text: string | null;
}

export function PromoBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('promo_banners')
          .select('id, title, subtitle, image_url, background_color, link_url, link_text, secondary_link_url, secondary_link_text, badge_text')
          .eq('active', true)
          .order('sort_order');
        
        if (error) throw error;
        setBanners(data || []);
      } catch (e) {
        console.error('Failed to load banners:', e);
      } finally {
        setLoading(false);
      }
    };
    loadBanners();
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (loading) {
    return (
      <section className="relative min-h-[60vh] flex items-center justify-center bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
      </section>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <section className="relative min-h-[60vh] lg:min-h-[70vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* Background */}
          <div 
            className="absolute inset-0"
            style={{ backgroundColor: currentBanner.background_color }}
          >
            {currentBanner.image_url && (
              <img 
                src={currentBanner.image_url} 
                alt={currentBanner.title}
                className="w-full h-full object-cover"
              />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          </div>

          {/* Content */}
          <div className="container relative z-10 h-full flex items-center py-16">
            <div className="max-w-xl text-white">
              {currentBanner.badge_text && (
                <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {currentBanner.badge_text}
                </Badge>
              )}
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4"
              >
                {currentBanner.title}
              </motion.h1>
              
              {currentBanner.subtitle && (
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg md:text-xl text-white/80 mb-8 max-w-md"
                >
                  {currentBanner.subtitle}
                </motion.p>
              )}

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-4"
              >
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-white text-foreground hover:bg-white/90 font-semibold h-12 px-6"
                >
                  <Link to={currentBanner.link_url}>
                    {currentBanner.link_text}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                
                {currentBanner.secondary_link_url && currentBanner.secondary_link_text && (
                  <Button 
                    asChild 
                    variant="outline" 
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 bg-transparent h-12 px-6"
                  >
                    <Link to={currentBanner.secondary_link_url}>
                      {currentBanner.secondary_link_text}
                    </Link>
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  index === currentIndex 
                    ? "bg-white w-8" 
                    : "bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
