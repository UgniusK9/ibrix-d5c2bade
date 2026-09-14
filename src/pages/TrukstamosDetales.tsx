import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { Puzzle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function TrukstamosDetales() {
  const { t } = useTranslation();

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-8">{t("pgMissing.title")}</h1>
          
          <div className="prose prose-lg max-w-none">
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Puzzle className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">{t("pgMissing.mainTitle")}</h2>
              </div>
              <p className="text-muted-foreground">
                {t("pgMissing.mainDesc")}
              </p>
            </div>

            <h3>{t("pgMissing.stepsTitle")}</h3>
            <ol className="text-muted-foreground">
              <li>{t("pgMissing.step1")}</li>
              <li>{t("pgMissing.step2")}</li>
              <li>{t("pgMissing.step3")}</li>
              <li>{t("pgMissing.step4")}</li>
            </ol>

            <div className="mt-8">
              <Button asChild>
                <Link to="/kontaktai">{t("pgMissing.reportButton")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
