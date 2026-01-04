import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustBadges } from "@/components/home/TrustBadges";
import { CollectionsSection } from "@/components/home/CollectionsSection";
import { ProductsSection } from "@/components/home/ProductsSection";
import { EditorialSection } from "@/components/home/EditorialSection";
import { RecommendationsCarousel } from "@/components/home/RecommendationsCarousel";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PreOrderSection } from "@/components/home/PreOrderSection";
import { FAQSection } from "@/components/home/FAQSection";
import { SEOHead } from "@/components/seo/SEOHead";

const Index = () => {
  return (
    <>
      <SEOHead 
        title="IBRIX" 
        description="IBRIX - Aukštos kokybės variklių ir mechaninių modelių parduotuvė Lietuvoje. Pre-order sistema, nemokamas pristatymas, 14 dienų grąžinimas."
        canonical="/"
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <TrustBadges />
          <CollectionsSection />
          <ProductsSection />
          <EditorialSection />
          <RecommendationsCarousel />
          <HowItWorks />
          <PreOrderSection />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
