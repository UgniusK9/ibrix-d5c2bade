import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustBadges } from "@/components/home/TrustBadges";
import { ProductsSection } from "@/components/home/ProductsSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PreOrderSection } from "@/components/home/PreOrderSection";
import { FAQSection } from "@/components/home/FAQSection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <TrustBadges />
        <ProductsSection />
        <HowItWorks />
        <PreOrderSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
