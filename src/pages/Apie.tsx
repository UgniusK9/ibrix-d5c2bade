import { Clock, Truck, Headphones, Puzzle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { Button } from "@/components/ui/button";

export default function Apie() {
  const { t } = useTranslation();

  const expectations = [
    {
      icon: Clock,
      title: t("pgAbout.exp1Title"),
      description: t("pgAbout.exp1Desc"),
    },
    {
      icon: Truck,
      title: t("pgAbout.exp2Title"),
      description: t("pgAbout.exp2Desc"),
    },
    {
      icon: Headphones,
      title: t("pgAbout.exp3Title"),
      description: t("pgAbout.exp3Desc"),
    },
    {
      icon: Puzzle,
      title: t("pgAbout.exp4Title"),
      description: t("pgAbout.exp4Desc"),
    },
  ];

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-8">
              {t("pgAbout.title")}
            </h1>

            {/* Story */}
            <div className="prose prose-lg max-w-none mb-16">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {t("pgAbout.story1")}
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {t("pgAbout.story2")}
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("pgAbout.story3")}
              </p>
            </div>

            {/* Expectations Card */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <h2 className="font-heading text-2xl font-bold mb-6">
                {t("pgAbout.expectationsTitle")}
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {expectations.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-6">
                {t("pgAbout.ctaText")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link to="/produktai/visi">
                    {t("pgAbout.browseConstructors")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/kontaktai">
                    {t("pgAbout.contactCta")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
