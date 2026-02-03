import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { PromoBanner } from "@/components/home/PromoBanner";
import { TrustBadges } from "@/components/home/TrustBadges";
import { TabbedProductCarousel } from "@/components/home/TabbedProductCarousel";
import { ProductsSection } from "@/components/home/ProductsSection";
import { BundlesSection } from "@/components/home/BundlesSection";
import { EditorialSection } from "@/components/home/EditorialSection";
import { RecommendationsCarousel } from "@/components/home/RecommendationsCarousel";
import { RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PreOrderSection } from "@/components/home/PreOrderSection";

import { SEOHead } from "@/components/seo/SEOHead";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";

const Index = () => {
  const [hasBanners, setHasBanners] = useState(false);
  const [checkingBanners, setCheckingBanners] = useState(true);
  const { data: products = [] } = useProducts();

  // Check if there are active promo banners
  useEffect(() => {
    const checkBanners = async () => {
      try {
        const { count, error } = await supabase
          .from('promo_banners')
          .select('id', { count: 'exact', head: true })
          .eq('active', true);
        
        if (!error && count && count > 0) {
          setHasBanners(true);
        }
      } catch (e) {
        console.error('Failed to check banners:', e);
      } finally {
        setCheckingBanners(false);
      }
    };
    checkBanners();
  }, []);

  return (
    <>
      <SEOHead 
        title="IBRIX" 
        description="IBRIX - Aukštos kokybės variklių ir mechaninių modelių parduotuvė Lietuvoje. Pre-order sistema, nemokamas pristatymas, 14 dienų grąžinimas."
        canonical="/"
      />
      <div className="min-h-screen flex flex-col overflow-x-hidden w-full">
        <Header />
        <main className="flex-1">
          {/* Show PromoBanner if there are active banners, otherwise show HeroSection */}
          {!checkingBanners && (hasBanners ? <PromoBanner /> : <HeroSection />)}
          <TrustBadges />
          {/* LEGO-style product carousel - replaces CollectionsSection */}
          <TabbedProductCarousel products={products} />
          <ProductsSection />
          <BundlesSection />
          <EditorialSection />
          <RecommendationsCarousel />
          <RecentlyViewedSection />
          <HowItWorks />
          <PreOrderSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
