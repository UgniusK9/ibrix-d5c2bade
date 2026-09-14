import { Link } from "react-router-dom";
import { ArrowRight, Clock, Package, Truck, RotateCcw, Headphones, CheckCircle2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { Button } from "@/components/ui/button";

function ShoppingCart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export default function PreOrder() {
  const { t } = useTranslation();

  const steps = [
    {
      number: "01",
      title: t("pgPreorder.step1Title"),
      description: t("pgPreorder.step1Desc"),
      icon: ShoppingCart,
    },
    {
      number: "02",
      title: t("pgPreorder.step2Title"),
      description: t("pgPreorder.step2Desc"),
      icon: Package,
    },
    {
      number: "03",
      title: t("pgPreorder.step3Title"),
      description: t("pgPreorder.step3Desc"),
      icon: Truck,
    },
  ];

  const bulletPoints = [
    {
      icon: Clock,
      title: t("pgPreorder.bullet1Title"),
      description: t("pgPreorder.bullet1Desc"),
    },
    {
      icon: RotateCcw,
      title: t("pgPreorder.bullet2Title"),
      description: t("pgPreorder.bullet2Desc"),
    },
    {
      icon: Truck,
      title: t("pgPreorder.bullet3Title"),
      description: t("pgPreorder.bullet3Desc"),
    },
    {
      icon: Headphones,
      title: t("pgPreorder.bullet4Title"),
      description: t("pgPreorder.bullet4Desc"),
    },
  ];

  return (
    <PageLayout>
      <RouteSEO />
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              <Clock className="w-4 h-4" />
              {t("pgPreorder.badge")}
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
              {t("pgPreorder.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("pgPreorder.subtitle")}
            </p>
          </div>

          {/* Timeline Steps */}
          <div className="relative max-w-4xl mx-auto">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-border" />
            
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={step.number} className="relative">
                  <div className="bg-card border border-border rounded-2xl p-6 h-full">
                    {/* Number badge */}
                    <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-heading font-bold text-lg mb-4">
                      {step.number}
                    </div>
                    
                    <h3 className="font-heading text-xl font-semibold mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Arrow for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-24 -right-4 transform -translate-y-1/2 z-10">
                      <div className="w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ETA Card */}
      <section className="py-12 bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-accent" />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-2">
                {t("pgPreorder.etaTitle")}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t("pgPreorder.etaSubtitle")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("pgPreorder.etaExplanation")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bullet Points */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-4">
            {t("pgPreorder.importantTitle")}
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            {t("pgPreorder.importantSubtitle")}
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {bulletPoints.map((point, index) => (
              <div key={index} className="flex gap-4 p-6 bg-card border border-border rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <point.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold mb-1">{point.title}</h3>
                  <p className="text-sm text-muted-foreground">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cancellation Policy */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-accent" />
            <h2 className="font-heading text-2xl font-bold mb-4">
              {t("pgPreorder.cancellationTitle")}
            </h2>
            <p className="text-primary-foreground/80 mb-6">
              {t("pgPreorder.cancellationBefore")}{" "}
              <strong>{t("pgPreorder.cancellationHighlight")}</strong>{" "}
              {t("pgPreorder.cancellationAfter")}
            </p>
            <div className="flex items-center justify-center gap-2 text-accent">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{t("pgPreorder.cancellationNote")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
              {t("pgPreorder.readyTitle")}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t("pgPreorder.readyDesc")}
            </p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to="/produktai/visi">
                {t("pgPreorder.browseConstructors")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
