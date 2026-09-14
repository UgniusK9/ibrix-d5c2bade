import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { Truck, Clock, MapPin, PackageSearch, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { COMPANY } from "@/config/company";

export default function Pristatymas() {
  const { t } = useTranslation();

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-2">{t("pgShipping.title")}</h1>
          <p className="text-sm text-muted-foreground mb-10">{t("pgShipping.updated", { date: COMPANY.updated })}</p>

          <div className="space-y-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">{t("pgShipping.priceTitle")}</h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2">
                <li>
                  <strong className="text-foreground">{t("pgShipping.lockerLead")}</strong>{" "}
                  {t("pgShipping.lockerRest")}
                </li>
                <li>
                  <strong className="text-foreground">{t("pgShipping.courierLead")}</strong>{" "}
                  {t("pgShipping.courierRest")}
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">{t("pgShipping.termsTitle")}</h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2">
                <li>
                  <strong className="text-foreground">{t("pgShipping.inStockLead")}</strong>{" "}
                  {t("pgShipping.inStockRest")}
                </li>
                <li>
                  <strong className="text-foreground">
                    {t("pgShipping.preorderLead")}
                  </strong>{" "}
                  {t("pgShipping.preorderRest")}
                </li>
              </ul>
              <p className="text-muted-foreground mt-4 mb-0">
                {t("pgShipping.termsNote")}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">{t("pgShipping.methodsTitle")}</h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2">
                <li>{t("pgShipping.methodOmniva")}</li>
                <li>{t("pgShipping.methodLpExpress")}</li>
                <li>{t("pgShipping.methodDpd")}</li>
                <li>{t("pgShipping.methodCourier")}</li>
              </ul>
              <p className="text-muted-foreground mt-4 mb-0">
                {t("pgShipping.onlyLt")}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <PackageSearch className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">{t("pgShipping.trackingTitle")}</h2>
              </div>
              <p className="text-muted-foreground m-0">
                {t("pgShipping.trackingBefore")}{" "}
                <a href="/siuntos-sekimas" className="text-primary underline">
                  {t("pgShipping.trackingLink")}
                </a>{" "}
                {t("pgShipping.trackingAfter")}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">{t("pgShipping.acceptTitle")}</h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2">
                <li>
                  {t("pgShipping.accept1")}
                </li>
                <li>
                  {t("pgShipping.accept2")}
                </li>
                <li>
                  {t("pgShipping.accept3")}
                </li>
              </ul>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-10">
            {t("pgShipping.footerBefore")}{" "}
            <a href="/taisykles" className="text-primary underline">
              {t("pgShipping.footerLink")}
            </a>
            {t("pgShipping.footerAfter")}
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
