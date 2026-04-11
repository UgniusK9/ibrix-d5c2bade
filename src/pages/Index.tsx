import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { SEOHead } from "@/components/seo/SEOHead";
import { lazy, Suspense, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";

// Lazy-load everything below the fold
const Footer = lazy(() => import("@/components/layout/Footer").then(m => ({ default: m.Footer })));
const PromoBanner = lazy(() => import("@/components/home/PromoBanner").then(m => ({ default: m.PromoBanner })));
const TrustBadges = lazy(() => import("@/components/home/TrustBadges").then(m => ({ default: m.TrustBadges })));
const TabbedProductCarousel = lazy(() => import("@/components/home/TabbedProductCarousel").then(m => ({ default: m.TabbedProductCarousel })));
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
  const { data: products = [] } = useProducts();

  // Check banners asynchronously — does NOT block hero render
  useEffect(() => {
    supabase
      .from('promo_banners')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)
      .then(({ count, error }) => {
        if (!error && count && count > 0) setHasBanners(true);
      });
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
          {/* Hero renders IMMEDIATELY — no blocking */}
          <HeroSection />

          {/* PromoBanner overlays on top only when data arrives */}
          {hasBanners && (
            <Suspense fallback={null}>
              <PromoBanner />
            </Suspense>
          )}

          <Suspense fallback={<SectionFallback />}>
            <TrustBadges />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <TabbedProductCarousel products={products} />
          </Suspense>
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
        <Suspense fallback={<div style={{ minHeight: 300 }} />}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
};

export default Index;
