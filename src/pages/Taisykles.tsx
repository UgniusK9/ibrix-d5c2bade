import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { useTranslation } from "react-i18next";
import { COMPANY, companyLine } from "@/config/company";

export default function Taisykles() {
  const { t } = useTranslation();
  const mailto = `mailto:${COMPANY.email}`;

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-2">{t("legTerms.title")}</h1>
          <p className="text-sm text-muted-foreground mb-10">{t("legTerms.updated", { date: COMPANY.updated })}</p>

          <div className="prose prose-lg max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-heading prose-strong:text-foreground">
            <h2 className="!mt-0">{t("legTerms.purchaseTitle")}</h2>

            <h3>{t("legTerms.buyGeneral.title")}</h3>
            <p>{t("legTerms.buyGeneral.p1", { site: COMPANY.site, company: companyLine() })}</p>
            <p>{t("legTerms.buyGeneral.p2")}</p>
            <p>{t("legTerms.buyGeneral.p3")}</p>
            <p>{t("legTerms.buyGeneral.p4")}</p>
            <p>{t("legTerms.buyGeneral.p5")}</p>

            <h3>{t("legTerms.buyContract.title")}</h3>
            <p>{t("legTerms.buyContract.p1")}</p>
            <p>{t("legTerms.buyContract.p2")}</p>
            <p>{t("legTerms.buyContract.p3")}</p>

            <h3>{t("legTerms.buyPrices.title")}</h3>
            <p>{t("legTerms.buyPrices.p1")}</p>
            <p>{t("legTerms.buyPrices.p2")}</p>
            <p>{t("legTerms.buyPrices.p3", { processor: COMPANY.paymentProcessor })}</p>
            <p>{t("legTerms.buyPrices.p4")}</p>

            <h3>{t("legTerms.buyPreorder.title")}</h3>
            <p>{t("legTerms.buyPreorder.p1")}</p>
            <p>{t("legTerms.buyPreorder.p2")}</p>
            <p>{t("legTerms.buyPreorder.p3")}</p>
            <p>{t("legTerms.buyPreorder.p4")}</p>

            <h3>{t("legTerms.buyDelivery.title")}</h3>
            <p>
              {t("legTerms.buyDelivery.p1pre")} <a href="/pristatymas">{t("legTerms.buyDelivery.p1link")}</a>
              {t("legTerms.buyDelivery.p1post")}
            </p>
            <p>{t("legTerms.buyDelivery.p2")}</p>
            <p>{t("legTerms.buyDelivery.p3")}</p>
            <p>{t("legTerms.buyDelivery.p4")}</p>

            <h3>{t("legTerms.buyWithdrawal.title")}</h3>
            <p>{t("legTerms.buyWithdrawal.p1")}</p>
            <p>
              {t("legTerms.buyWithdrawal.p2pre")} <a href={mailto}>{COMPANY.email}</a>
              {t("legTerms.buyWithdrawal.p2mid")} <a href="/grazinimai">{t("legTerms.buyWithdrawal.p2link")}</a>
              {t("legTerms.buyWithdrawal.p2post")}
            </p>
            <p>{t("legTerms.buyWithdrawal.p3")}</p>
            <p>{t("legTerms.buyWithdrawal.p4")}</p>
            <p>{t("legTerms.buyWithdrawal.p5")}</p>

            <h3>{t("legTerms.buyQuality.title")}</h3>
            <p>{t("legTerms.buyQuality.p1")}</p>
            <p>{t("legTerms.buyQuality.p2")}</p>
            <p>{t("legTerms.buyQuality.p3")}</p>

            <h3>{t("legTerms.buyMissing.title")}</h3>
            <p>
              {t("legTerms.buyMissing.p1pre")} <a href="/trukstamos-detales">{t("legTerms.buyMissing.p1link")}</a>
              {t("legTerms.buyMissing.p1post")}
            </p>
            <p>{t("legTerms.buyMissing.p2")}</p>

            <h3>{t("legTerms.buyLiability.title")}</h3>
            <p>{t("legTerms.buyLiability.p1")}</p>
            <p>{t("legTerms.buyLiability.p2")}</p>
            <p>{t("legTerms.buyLiability.p3")}</p>

            <h3>{t("legTerms.buyPrivacy.title")}</h3>
            <p>
              {t("legTerms.buyPrivacy.p1pre")} <a href="/privatumo-politika">{t("legTerms.buyPrivacy.p1link")}</a>{" "}
              {t("legTerms.buyPrivacy.p1post")}
            </p>

            <h3>{t("legTerms.buyDisputes.title")}</h3>
            <p>
              {t("legTerms.buyDisputes.p1pre")} <a href={mailto}>{COMPANY.email}</a>
              {t("legTerms.buyDisputes.p1post")}
            </p>
            <p>
              {t("legTerms.buyDisputes.p2pre", { vvtat: COMPANY.vvtat })}{" "}
              <a href={COMPANY.vvtatUrl} target="_blank" rel="noopener noreferrer">
                vvtat.lt
              </a>{" "}
              {t("legTerms.buyDisputes.p2mid")}{" "}
              <a href={COMPANY.odrUrl} target="_blank" rel="noopener noreferrer">
                ec.europa.eu/odr
              </a>{" "}
              {t("legTerms.buyDisputes.p2post")}
            </p>
            <p>{t("legTerms.buyDisputes.p3")}</p>

            <h3>{t("legTerms.buySeller.title")}</h3>
            <p>
              {COMPANY.legalName}
              <br />
              {t("legTerms.buySeller.codeLabel")} {COMPANY.regCode}
              {COMPANY.vatCode ? (
                <>
                  <br />
                  {t("legTerms.buySeller.vatLabel")} {COMPANY.vatCode}
                </>
              ) : null}
              <br />
              {t("legTerms.buySeller.addressLabel")} {COMPANY.address}, {COMPANY.country}
              <br />
              {t("legTerms.buySeller.emailLabel")} <a href={mailto}>{COMPANY.email}</a>
            </p>

            <hr className="my-12" />

            <h2 className="!mt-0">{t("legTerms.usageTitle")}</h2>
            <h3>{t("legTerms.useGeneral.title")}</h3>
            <p>{t("legTerms.useGeneral.p1")}</p>
            <p>{t("legTerms.useGeneral.p2")}</p>
            <p>{t("legTerms.useGeneral.p3")}</p>
            <p>{t("legTerms.useGeneral.p4")}</p>
            <p>{t("legTerms.useGeneral.p5")}</p>
            <p>{t("legTerms.useGeneral.p6")}</p>
            <p>{t("legTerms.useGeneral.p7")}</p>

            <h3>{t("legTerms.useAccount.title")}</h3>
            <p>{t("legTerms.useAccount.p1")}</p>
            <p>{t("legTerms.useAccount.p2")}</p>
            <p>{t("legTerms.useAccount.p3")}</p>
            <p>{t("legTerms.useAccount.p4")}</p>
            <p>
              {t("legTerms.useAccount.p5pre")} <a href={mailto}>{COMPANY.email}</a>
              {t("legTerms.useAccount.p5mid")} <a href="/privatumo-politika">{t("legTerms.useAccount.p5link")}</a>
              {t("legTerms.useAccount.p5post")}
            </p>

            <h3>{t("legTerms.useRights.title")}</h3>
            <p>{t("legTerms.useRights.fairUse")}</p>
            <p>{t("legTerms.useRights.banIntro")}</p>
            <ul>
              <li>{t("legTerms.useRights.ban1")}</li>
              <li>{t("legTerms.useRights.ban2")}</li>
              <li>{t("legTerms.useRights.ban3")}</li>
              <li>{t("legTerms.useRights.ban4")}</li>
              <li>{t("legTerms.useRights.ban5")}</li>
            </ul>
            <p>{t("legTerms.useRights.respInfo")}</p>
            <p>{t("legTerms.useRights.reviewTrue")}</p>
            <p>{t("legTerms.useRights.reviewRemove")}</p>
            <p>{t("legTerms.useRights.restrict")}</p>
            <p>{t("legTerms.useRights.warnFirst")}</p>
            <p>{t("legTerms.useRights.restrictOrders")}</p>
            <p>{t("legTerms.useRights.provideService")}</p>
            <p>
              {t("legTerms.useRights.respectPre")} <a href="/privatumo-politika">{t("legTerms.useRights.respectLink")}</a>
              {t("legTerms.useRights.respectPost")}
            </p>
            <p>{t("legTerms.useRights.shutdown")}</p>
            <p>{t("legTerms.useRights.leaveFree")}</p>

            <h3>{t("legTerms.useOrdering.title")}</h3>
            <p>{t("legTerms.useOrdering.p1")}</p>
            <p>{t("legTerms.useOrdering.p2")}</p>
            <p>{t("legTerms.useOrdering.p3")}</p>
            <p>{t("legTerms.useOrdering.p4")}</p>
            <p>{t("legTerms.useOrdering.p5")}</p>
            <p>{t("legTerms.useOrdering.p6")}</p>
            <p>{t("legTerms.useOrdering.p7")}</p>
            <p>{t("legTerms.useOrdering.p8")}</p>
            <p>{t("legTerms.useOrdering.p9")}</p>
            <p>
              {t("legTerms.useOrdering.p10pre")} <a href="/grazinimai">{t("legTerms.useOrdering.returnsLink")}</a>{" "}
              {t("legTerms.useOrdering.and")} <a href="/garantija">{t("legTerms.useOrdering.warrantyLink")}</a>
              {t("legTerms.useOrdering.p10post")}
            </p>

            <h3>{t("legTerms.useIp.title")}</h3>
            <p>{t("legTerms.useIp.p1")}</p>
            <p>{t("legTerms.useIp.p2")}</p>
            <p>{t("legTerms.useIp.p3")}</p>
            <p>{t("legTerms.useIp.p4")}</p>
            <p>{t("legTerms.useIp.p5")}</p>

            <h3>{t("legTerms.useLiability.title")}</h3>
            <p>{t("legTerms.useLiability.p1")}</p>
            <p>{t("legTerms.useLiability.p2")}</p>
            <p>{t("legTerms.useLiability.p3")}</p>
            <p>{t("legTerms.useLiability.p4")}</p>
            <p>{t("legTerms.useLiability.p5")}</p>
            <p>
              6.6. <strong>{t("legTerms.useLiability.p6em")}</strong> {t("legTerms.useLiability.p6post")}
            </p>

            <h3>{t("legTerms.useNotices.title")}</h3>
            <p>{t("legTerms.useNotices.p1")}</p>
            <p>{t("legTerms.useNotices.p2")}</p>
            <p>{t("legTerms.useNotices.p3")}</p>
            <p>
              {t("legTerms.useNotices.p4pre")} <a href={mailto}>{COMPANY.email}</a>
              {t("legTerms.useNotices.p4post")}
            </p>
            <p>
              {t("legTerms.useNotices.p5pre")} <a href="/kontaktai">{t("legTerms.useNotices.p5link")}</a>{" "}
              {t("legTerms.useNotices.p5post")}
            </p>

            <h3>{t("legTerms.useFinal.title")}</h3>
            <p>{t("legTerms.useFinal.p1")}</p>
            <p>{t("legTerms.useFinal.p2")}</p>
            <p>{t("legTerms.useFinal.p3")}</p>
            <p>{t("legTerms.useFinal.p4")}</p>
            <p>
              {t("legTerms.useFinal.p5pre")} <a href={mailto}>{COMPANY.email}</a>
              {t("legTerms.useFinal.p5post")}
            </p>
            <p>
              {t("legTerms.useFinal.p6pre", { vvtat: COMPANY.vvtat })}{" "}
              <a href={COMPANY.vvtatUrl} target="_blank" rel="noopener noreferrer">
                vvtat.lt
              </a>{" "}
              {t("legTerms.useFinal.p6mid")}{" "}
              <a href={COMPANY.odrUrl} target="_blank" rel="noopener noreferrer">
                ec.europa.eu/odr
              </a>{" "}
              {t("legTerms.useFinal.p6post")}
            </p>

          </div>
        </div>
      </section>
    </PageLayout>
  );
}
