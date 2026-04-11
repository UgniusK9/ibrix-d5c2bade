import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { PromoBanner } from "@/components/home/PromoBanner";
import { TrustBadges } from "@/components/home/TrustBadges";
import { TabbedProductCarousel } from "@/components/home/TabbedProductCarousel";
import { SEOHead } from "@/components/seo/SEOHead";
import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";

// Lazy-load below-the-fold sections
const ProductsSection = lazy(() => import("@/components/home/ProductsSection").then(m => ({ default: m.ProductsSection })));
const BundlesSection = lazy(() => import("@/components/home/BundlesSection").then(m => ({ default: m.BundlesSection })));
const EditorialSection = lazy(() => import("@/components/home/EditorialSection").then(m => ({ default: m.EditorialSection })));
const RecommendationsCarousel = lazy(() => import("@/components/home/RecommendationsCarousel").then(m => ({ default: m.RecommendationsCarousel })));
const RecentlyViewedSection = lazy(() => import("@/components/home/RecentlyViewedSection").then(m => ({ default: m.RecentlyViewedSection })));
const HowItWorks = lazy(() => import("@/components/home/HowItWorks").then(m => ({ default: m.HowItWorks })));
const PreOrderSection = lazy(() => import("@/components/home/PreOrderSection").then(m => ({ default: m.PreOrderSection })));

const SectionFallback = () => <div style={{ minHeight: 200 }} />;

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
          {/* Reserve hero space during banner check to prevent CLS */}
          {checkingBanners ? (
            <div className="min-h-[80vh] gradient-hero" />
          ) : (
            hasBanners ? <PromoBanner /> : <HeroSection />
          )}
          <TrustBadges />
          <TabbedProductCarousel products={products} />
          <Suspense fallback={<SectionFallback />}>
            <ProductsSection />
            <BundlesSection />
            <EditorialSection />
            <RecommendationsCarousel />
            <RecentlyViewedSection />
            <HowItWorks />
            <PreOrderSection />
          </Suspense>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
