import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCookieConsentStore } from "@/stores/cookieConsentStore";
import { COMPANY, companyLine } from "@/config/company";

export default function PrivatumoPolitika() {
  const { t } = useTranslation();
  const { openModal } = useCookieConsentStore();
  const mailto = `mailto:${COMPANY.email}`;
  const h2 = "text-2xl font-heading font-semibold text-foreground mt-8 mb-4";

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-2">
            {t("legPrivacy.title")}
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            {t("legPrivacy.updated", { date: COMPANY.updated })}
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <p className="lead text-foreground/80">
              {t("legPrivacy.lead", { site: COMPANY.site })}
            </p>

            <section>
              <h2 className={h2}>{t("legPrivacy.general.title")}</h2>
              <p>{t("legPrivacy.general.p1", { site: COMPANY.site, company: companyLine() })}</p>
              <p>{t("legPrivacy.general.p2")}</p>
              <p>{t("legPrivacy.general.p3")}</p>
              <p>{t("legPrivacy.general.p4")}</p>
              <p>{t("legPrivacy.general.p5")}</p>
              <p>{t("legPrivacy.general.p6")}</p>
            </section>

            <section>
              <h2 className={h2}>{t("legPrivacy.controller.title")}</h2>
              <p>{t("legPrivacy.controller.intro")}</p>
              <p>
                {COMPANY.legalName}
                <br />
                {t("legPrivacy.controller.codeLabel")} {COMPANY.regCode}
                {COMPANY.vatCode ? (
                  <>
                    <br />
                    {t("legPrivacy.controller.vatLabel")} {COMPANY.vatCode}
                  </>
                ) : null}
                <br />
                {t("legPrivacy.controller.addressLabel")} {COMPANY.address}, {COMPANY.country}
                <br />
                {t("legPrivacy.controller.emailLabel")}{" "}
                <a href={mailto} className="text-accent hover:underline">
                  {COMPANY.email}
                </a>
              </p>
              <p>{t("legPrivacy.controller.dpo")}</p>
            </section>

            <section>
              <h2 className={h2}>{t("legPrivacy.collected.title")}</h2>
              <p>
                {t("legPrivacy.collected.regNum")} <strong className="text-foreground">{t("legPrivacy.collected.regLabel")}</strong>{" "}
                {t("legPrivacy.collected.regText")}
              </p>
              <p>
                {t("legPrivacy.collected.orderNum")} <strong className="text-foreground">{t("legPrivacy.collected.orderLabel")}</strong>{" "}
                {t("legPrivacy.collected.orderText")}
              </p>
              <p>
                {t("legPrivacy.collected.invoiceNum")} <strong className="text-foreground">{t("legPrivacy.collected.invoiceLabel")}</strong>{" "}
                {t("legPrivacy.collected.invoiceText")}
              </p>
              <p>
                {t("legPrivacy.collected.paymentNum")} <strong className="text-foreground">{t("legPrivacy.collected.paymentLabel")}</strong>{" "}
                {t("legPrivacy.collected.paymentPre", { processor: COMPANY.paymentProcessor })}{" "}
                <strong className="text-foreground">{t("legPrivacy.collected.paymentEm")}</strong>
                {t("legPrivacy.collected.paymentPost")}
              </p>
              <p>
                {t("legPrivacy.collected.deliveryNum")} <strong className="text-foreground">{t("legPrivacy.collected.deliveryLabel")}</strong>{" "}
                {t("legPrivacy.collected.deliveryText")}
              </p>
              <p>
                {t("legPrivacy.collected.cartNum")} <strong className="text-foreground">{t("legPrivacy.collected.cartLabel")}</strong>{" "}
                {t("legPrivacy.collected.cartText")}
              </p>
              <p>
                {t("legPrivacy.collected.creditsNum")}{" "}
                <strong className="text-foreground">{t("legPrivacy.collected.creditsLabel")}</strong>{" "}
                {t("legPrivacy.collected.creditsText")}
              </p>
              <p>
                {t("legPrivacy.collected.reviewsNum")} <strong className="text-foreground">{t("legPrivacy.collected.reviewsLabel")}</strong>{" "}
                {t("legPrivacy.collected.reviewsText")}
              </p>
              <p>
                {t("legPrivacy.collected.requestsNum")}{" "}
                <strong className="text-foreground">{t("legPrivacy.collected.requestsLabel")}</strong>{" "}
                {t("legPrivacy.collected.requestsText")}
              </p>
              <p>
                {t("legPrivacy.collected.newsletterNum")} <strong className="text-foreground">{t("legPrivacy.collected.newsletterLabel")}</strong>{" "}
                {t("legPrivacy.collected.newsletterText")}
              </p>
              <p>
                {t("legPrivacy.collected.technicalNum")} <strong className="text-foreground">{t("legPrivacy.collected.technicalLabel")}</strong>{" "}
                {t("legPrivacy.collected.technicalText")}
              </p>
              <p>
                {t("legPrivacy.collected.specialNum")} {t("legPrivacy.collected.specialPre")}{" "}
                <strong className="text-foreground">{t("legPrivacy.collected.specialEm")}</strong>{" "}
                {t("legPrivacy.collected.specialPost")}
              </p>
            </section>

            <section>
              <h2 className={h2}>{t("legPrivacy.legalBasis.title")}</h2>
              <p>{t("legPrivacy.legalBasis.intro")}</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">{t("legPrivacy.legalBasis.contractLabel")}</strong>{" "}
                  {t("legPrivacy.legalBasis.contractText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.legalBasis.obligationLabel")}</strong>{" "}
                  {t("legPrivacy.legalBasis.obligationText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.legalBasis.consentLabel")}</strong>{" "}
                  {t("legPrivacy.legalBasis.consentText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.legalBasis.interestLabel")}</strong>{" "}
                  {t("legPrivacy.legalBasis.interestText")}
                </li>
              </ul>
              <p className="mt-4">{t("legPrivacy.legalBasis.noteWithdraw")}</p>
              <p>{t("legPrivacy.legalBasis.noteRequired")}</p>
            </section>

            <section>
              <h2 className={h2}>{t("legPrivacy.purposes.title")}</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>{t("legPrivacy.purposes.item1")}</li>
                <li>{t("legPrivacy.purposes.item2")}</li>
                <li>{t("legPrivacy.purposes.item3")}</li>
                <li>{t("legPrivacy.purposes.item4")}</li>
                <li>{t("legPrivacy.purposes.item5")}</li>
                <li>{t("legPrivacy.purposes.item6")}</li>
                <li>{t("legPrivacy.purposes.item7")}</li>
                <li>{t("legPrivacy.purposes.item8")}</li>
                <li>{t("legPrivacy.purposes.item9")}</li>
                <li>{t("legPrivacy.purposes.item10")}</li>
              </ul>
              <p className="mt-4">
                {t("legPrivacy.purposes.noAutoNum")} {t("legPrivacy.purposes.noAutoPre")}{" "}
                <strong className="text-foreground">{t("legPrivacy.purposes.noAutoEm")}</strong>{" "}
                {t("legPrivacy.purposes.noAutoPost")}
              </p>
              <p>
                {t("legPrivacy.purposes.noSaleNum")} {t("legPrivacy.purposes.noSalePre")}{" "}
                <strong className="text-foreground">{t("legPrivacy.purposes.noSaleEm")}</strong>{" "}
                {t("legPrivacy.purposes.noSalePost")}
              </p>
            </section>

            <section>
              <h2 className={h2}>{t("legPrivacy.recipients.title")}</h2>
              <p>{t("legPrivacy.recipients.intro")}</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">{COMPANY.paymentProcessor}</strong> –{" "}
                  {t("legPrivacy.recipients.payseraText")}
                </li>
                <li>
                  <strong className="text-foreground">Omniva, LP Express, DPD</strong> –{" "}
                  {t("legPrivacy.recipients.carriersText")}
                </li>
                <li>
                  <strong className="text-foreground">Supabase</strong> –{" "}
                  {t("legPrivacy.recipients.supabaseText")}
                </li>
                <li>
                  <strong className="text-foreground">Vercel</strong> –{" "}
                  {t("legPrivacy.recipients.vercelText")}
                </li>
                <li>
                  <strong className="text-foreground">Resend</strong> –{" "}
                  {t("legPrivacy.recipients.resendText")}
                </li>
                <li>
                  <strong className="text-foreground">Cloudflare Turnstile</strong> –{" "}
                  {t("legPrivacy.recipients.turnstileText")}
                </li>
                <li>
                  <strong className="text-foreground">Google Analytics</strong> –{" "}
                  {t("legPrivacy.recipients.analyticsText")}
                </li>
                <li>
                  <strong className="text-foreground">Meta, TikTok</strong> –{" "}
                  {t("legPrivacy.recipients.marketingText")}
                </li>
              </ul>
              <p className="mt-4">{t("legPrivacy.recipients.noteProviders")}</p>
              <p>{t("legPrivacy.recipients.noteThirdCountries")}</p>
            </section>

            <section>
              <h2 className={h2}>{t("legPrivacy.cookiesInfo.title")}</h2>
              <p>{t("legPrivacy.cookiesInfo.p1")}</p>
              <p>
                {t("legPrivacy.cookiesInfo.p2num")}{" "}
                <strong className="text-foreground">{t("legPrivacy.cookiesInfo.p2label")}</strong>{" "}
                {t("legPrivacy.cookiesInfo.p2text")}
              </p>
              <p>
                {t("legPrivacy.cookiesInfo.p3pre")}{" "}
                <strong className="text-foreground">{t("legPrivacy.cookiesInfo.p3em")}</strong>
                {t("legPrivacy.cookiesInfo.p3post")}
              </p>
              <p>{t("legPrivacy.cookiesInfo.p4")}</p>
              <p>
                {t("legPrivacy.cookiesInfo.p5pre")}{" "}
                <Link to="/slapukai" className="text-accent hover:underline">
                  {t("legPrivacy.cookiesInfo.p5link")}
                </Link>
                .
              </p>
              <button
                onClick={openModal}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                {t("legPrivacy.cookiesInfo.button")}
              </button>
            </section>

            <section>
              <h2 className={h2}>{t("legPrivacy.marketing.title")}</h2>
              <p>
                {t("legPrivacy.marketing.pre")}{" "}
                <a href={mailto} className="text-accent hover:underline">
                  {COMPANY.email}
                </a>
                .
              </p>
              <p>{t("legPrivacy.marketing.orderMail")}</p>
            </section>

            <section>
              <h2 className={h2}>{t("legPrivacy.retention.title")}</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-foreground">{t("legPrivacy.retention.ordersLabel")}</strong> –{" "}
                  {t("legPrivacy.retention.ordersText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.retention.accountLabel")}</strong> –{" "}
                  {t("legPrivacy.retention.accountText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.retention.preorderLabel")}</strong> –{" "}
                  {t("legPrivacy.retention.preorderText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.retention.cartLabel")}</strong> –{" "}
                  {t("legPrivacy.retention.cartText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.retention.warrantyLabel")}</strong> –{" "}
                  {t("legPrivacy.retention.warrantyText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.retention.inquiriesLabel")}</strong> –{" "}
                  {t("legPrivacy.retention.inquiriesText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.retention.newsletterLabel")}</strong> –{" "}
                  {t("legPrivacy.retention.newsletterText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.retention.consentLabel")}</strong> –{" "}
                  {t("legPrivacy.retention.consentText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.retention.analyticsLabel")}</strong> –{" "}
                  {t("legPrivacy.retention.analyticsText")}
                </li>
              </ul>
              <p className="mt-4">{t("legPrivacy.retention.note")}</p>
            </section>

            <section>
              <h2 className={h2}>{t("legPrivacy.rights.title")}</h2>
              <p>{t("legPrivacy.rights.intro")}</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">{t("legPrivacy.rights.accessLabel")}</strong>{" "}
                  {t("legPrivacy.rights.accessText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.rights.rectifyLabel")}</strong>{" "}
                  {t("legPrivacy.rights.rectifyText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.rights.eraseLabel")}</strong>{" "}
                  {t("legPrivacy.rights.eraseText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.rights.restrictLabel")}</strong>{" "}
                  {t("legPrivacy.rights.restrictText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.rights.portabilityLabel")}</strong>{" "}
                  {t("legPrivacy.rights.portabilityText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.rights.objectLabel")}</strong>{" "}
                  {t("legPrivacy.rights.objectText")}
                </li>
                <li>
                  <strong className="text-foreground">{t("legPrivacy.rights.withdrawLabel")}</strong>{" "}
                  {t("legPrivacy.rights.withdrawText")}
                </li>
              </ul>
              <p className="mt-4">
                {t("legPrivacy.rights.requestPre")}{" "}
                <a href={mailto} className="text-accent hover:underline">
                  {COMPANY.email}
                </a>
                {t("legPrivacy.rights.requestPost")}
              </p>
              <p>{t("legPrivacy.rights.identity")}</p>
              <p>{t("legPrivacy.rights.eraseLimit")}</p>
              <p>
                {t("legPrivacy.rights.complaintPre")}{" "}
                <a
                  href="https://vdai.lrv.lt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  vdai.lrv.lt
                </a>{" "}
                {t("legPrivacy.rights.complaintPost")}
              </p>
            </section>

            <section>
              <h2 className={h2}>{t("legPrivacy.security.title")}</h2>
              <p>{t("legPrivacy.security.intro")}</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>{t("legPrivacy.security.item1")}</li>
                <li>{t("legPrivacy.security.item2")}</li>
                <li>{t("legPrivacy.security.item3")}</li>
                <li>{t("legPrivacy.security.item4")}</li>
                <li>{t("legPrivacy.security.item5")}</li>
              </ul>
              <p className="mt-4">{t("legPrivacy.security.creds")}</p>
              <p>{t("legPrivacy.security.phishing")}</p>
              <p>{t("legPrivacy.security.noGuarantee")}</p>
              <p>{t("legPrivacy.security.breach")}</p>
            </section>

            <section>
              <h2 className={h2}>{t("legPrivacy.minors.title")}</h2>
              <p>{t("legPrivacy.minors.p1")}</p>
              <p>{t("legPrivacy.minors.p2")}</p>
              <p>{t("legPrivacy.minors.p3")}</p>
            </section>

            <section>
              <h2 className={h2}>{t("legPrivacy.final.title")}</h2>
              <p>{t("legPrivacy.final.p1")}</p>
              <p>{t("legPrivacy.final.p2")}</p>
              <p>{t("legPrivacy.final.p3")}</p>
              <p>
                {t("legPrivacy.final.pre")}{" "}
                <a href={mailto} className="text-accent hover:underline">
                  {COMPANY.email}
                </a>
                {t("legPrivacy.final.mid")}{" "}
                <Link to="/taisykles" className="text-accent hover:underline">
                  {t("legPrivacy.final.termsLink")}
                </Link>{" "}
                {t("legPrivacy.final.and")}{" "}
                <Link to="/slapukai" className="text-accent hover:underline">
                  {t("legPrivacy.final.cookiesLink")}
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
