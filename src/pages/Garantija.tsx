import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Garantija() {
  const { t } = useTranslation();

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-8">{t("pgWarranty.title")}</h1>
          
          <div className="prose prose-lg max-w-none">
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">{t("pgWarranty.mainTitle")}</h2>
              </div>
              <p className="text-muted-foreground">
                {t("pgWarranty.mainDesc")}
              </p>
            </div>

            <h3>{t("pgWarranty.coversTitle")}</h3>
            <ul className="text-muted-foreground">
              <li>{t("pgWarranty.covers1")}</li>
              <li>{t("pgWarranty.covers2")}</li>
              <li>{t("pgWarranty.covers3")}</li>
            </ul>

            <h3>{t("pgWarranty.notCoversTitle")}</h3>
            <ul className="text-muted-foreground">
              <li>{t("pgWarranty.notCovers1")}</li>
              <li>{t("pgWarranty.notCovers2")}</li>
              <li>{t("pgWarranty.notCovers3")}</li>
            </ul>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
