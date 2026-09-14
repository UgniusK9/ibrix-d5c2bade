import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { RotateCcw, PackageCheck, Ban, Wrench, Wallet, ShieldCheck, BadgeCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { COMPANY } from "@/config/company";

export default function Grazinimai() {
  const { t } = useTranslation();
  const mailto = `mailto:${COMPANY.email}`;

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-2">{t("pgReturns.title")}</h1>
          <p className="text-sm text-muted-foreground mb-10">{t("pgReturns.updated", { date: COMPANY.updated })}</p>

          <div className="space-y-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <RotateCcw className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">{t("pgReturns.rightTitle")}</h2>
              </div>
              <p className="text-muted-foreground m-0">
                {t("pgReturns.rightDesc")}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <PackageCheck className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">{t("pgReturns.howTitle")}</h2>
              </div>
              <ol className="text-muted-foreground m-0 space-y-2 list-decimal ml-4">
                <li>
                  {t("pgReturns.howStep1Before")}{" "}
                  <a href={mailto} className="text-primary underline">{COMPANY.email}</a>{" "}
                  {t("pgReturns.howStep1After")}
                </li>
                <li>{t("pgReturns.howStep2")}</li>
                <li>{t("pgReturns.howStep3")}</li>
                <li>{t("pgReturns.howStep4")}</li>
              </ol>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">
                  {t("pgReturns.qualityTitle")}
                </h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2 list-disc ml-4">
                <li>{t("pgReturns.quality1")}</li>
                <li>{t("pgReturns.quality2")}</li>
                <li>{t("pgReturns.quality3")}</li>
                <li>{t("pgReturns.quality4")}</li>
              </ul>
              <p className="text-muted-foreground mt-4 mb-0">
                <strong className="text-foreground">{t("pgReturns.importantLead")}</strong>{" "}
                {t("pgReturns.importantRest")}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Ban className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">
                  {t("pgReturns.excludedTitle")}
                </h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2 list-disc ml-4">
                <li>{t("pgReturns.excluded1")}</li>
                <li>{t("pgReturns.excluded2")}</li>
                <li>{t("pgReturns.excluded3")}</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wrench className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">{t("pgReturns.defectiveTitle")}</h2>
              </div>
              <p className="text-muted-foreground mb-3">
                {t("pgReturns.defectiveDesc")}
              </p>
              <p className="text-muted-foreground m-0">
                {t("pgReturns.missingBefore")}{" "}
                <strong className="text-foreground">{t("pgReturns.missingHighlight")}</strong>
                {t("pgReturns.missingMiddle")}{" "}
                <a href="/trukstamos-detales" className="text-primary underline">
                  {t("pgReturns.missingLink")}
                </a>
                {t("pgReturns.missingAfter")}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">{t("pgReturns.refundTitle")}</h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2 list-disc ml-4">
                <li>
                  {t("pgReturns.refund1")}
                </li>
                <li>
                  {t("pgReturns.refund2")}
                </li>
                <li>
                  {t("pgReturns.refund3")}
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <BadgeCheck className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">{t("pgReturns.warrantyTitle")}</h2>
              </div>
              <p className="text-muted-foreground mb-3">
                {t("pgReturns.warrantyDesc1")}
              </p>
              <p className="text-muted-foreground mb-3">
                {t("pgReturns.warrantyDesc2Before")}{" "}
                <strong className="text-foreground">{t("pgReturns.warrantyDesc2Highlight")}</strong>{" "}
                {t("pgReturns.warrantyDesc2Rest")}
              </p>
              <p className="text-muted-foreground m-0">
                {t("pgReturns.warrantyDesc3Before")}{" "}
                <a href={mailto} className="text-primary underline">
                  {COMPANY.email}
                </a>{" "}
                {t("pgReturns.warrantyDesc3Middle")}{" "}
                <a href="/garantija" className="text-primary underline">
                  {t("pgReturns.warrantyDesc3Link")}
                </a>
                {t("pgReturns.warrantyDesc3After")}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-10">
            {t("pgReturns.footerBefore")}{" "}
            <a href="/taisykles" className="text-primary underline">
              {t("pgReturns.footerLink")}
            </a>
            {t("pgReturns.footerMiddle")} {COMPANY.vvtat} (
            <a href={COMPANY.vvtatUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              vvtat.lt
            </a>
            {t("pgReturns.footerAfter")})
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
