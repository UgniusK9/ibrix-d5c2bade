import { Link } from "react-router-dom";
import { ArrowRight, Truck, RotateCcw, Shield, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useProducts, getProductImage, getEtaString, formatPrice } from "@/hooks/useProducts";

const trust = [
  { icon: Truck, text: "hero.freeShippingLt" },
  { icon: RotateCcw, text: "hero.returns14days" },
  { icon: Shield, text: "hero.securePayments" },
  { icon: Wrench, text: "hero.freeMissingParts" },
];

export function HeroSection() {
  const { t } = useTranslation();
  const { data: products, isLoading } = useProducts();
  const featuredProduct = products?.[0];

  return (
    <section className="bg-background border-b border-border">
      <div className="container py-10 md:py-14 lg:py-20">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
          {/* Left: copy — this is the LCP element (text) */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent mb-4">
              {t('hero.collection')}
            </p>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.05] tracking-tight mb-5">
              {t('hero.title')} {t('hero.titleAccent')}
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Button asChild size="lg" variant="accent">
                <Link to="/produktai/visi">
                  {t('hero.cta')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pre-order">{t('hero.howPreOrder')}</Link>
              </Button>
            </div>

            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {trust.map((item) => (
                <li key={item.text} className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 text-foreground/70 shrink-0" strokeWidth={1.75} />
                  {t(item.text)}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: featured product */}
          <div className="hidden lg:block">
            {isLoading ? (
              <div className="aspect-[4/3] rounded-2xl bg-secondary animate-pulse" />
            ) : featuredProduct ? (
              <Link
                to={`/produktas/${featuredProduct.slug}`}
                className="group block bg-card rounded-2xl overflow-hidden border border-border shadow-soft hover:shadow-medium transition-shadow"
              >
                <div className="relative aspect-[4/3] bg-white overflow-hidden">
                  <Badge className="absolute top-4 left-4 z-10 bg-foreground text-background">
                    {t('common.mostPopular')}
                  </Badge>
                  <img
                    src={getProductImage(featuredProduct)}
                    alt={featuredProduct.title}
                    width={600}
                    height={450}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5 flex items-center justify-between gap-4 border-t border-border">
                  <div className="min-w-0">
                    <h3 className="font-heading font-semibold text-base truncate">
                      {featuredProduct.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {featuredProduct.stock_status === "preorder" ? t('products.preOrderLabel') : t('products.inStockLabel')} · {getEtaString(featuredProduct)}
                    </p>
                  </div>
                  <p className="font-heading font-bold text-xl shrink-0">
                    {formatPrice(featuredProduct.price_eur)}
                  </p>
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
