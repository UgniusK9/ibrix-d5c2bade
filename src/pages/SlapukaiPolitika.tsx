import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCookieConsentStore } from "@/stores/cookieConsentStore";
import { COMPANY } from "@/config/company";

/**
 * The cookie inventory below is taken from what the code actually sets:
 * CookieConsentProvider (GA / Meta / TikTok loaders), useUtmTracking and
 * cookieConsentStore. If a tracker is added or removed, update this table —
 * the privacy policy points here as the detailed list, so a stale table makes
 * that policy inaccurate too.
 */

interface CookieRow {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
}

function CookieTable({ rows }: { rows: CookieRow[] }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto not-prose my-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 font-medium text-foreground">{t("legCookies.thead.name")}</th>
            <th className="text-left py-2 pr-4 font-medium text-foreground">{t("legCookies.thead.provider")}</th>
            <th className="text-left py-2 pr-4 font-medium text-foreground">{t("legCookies.thead.purpose")}</th>
            <th className="text-left py-2 font-medium text-foreground whitespace-nowrap">{t("legCookies.thead.duration")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.name} className="border-b border-border/50 align-top">
              <td className="py-2 pr-4 font-mono text-xs text-foreground">{c.name}</td>
              <td className="py-2 pr-4">{c.provider}</td>
              <td className="py-2 pr-4">{c.purpose}</td>
              <td className="py-2 whitespace-nowrap">{c.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SlapukaiPolitika() {
  const { t } = useTranslation();
  const { openModal } = useCookieConsentStore();
  const h2 = "text-2xl font-heading font-semibold text-foreground mt-8 mb-4";

  const NECESSARY: CookieRow[] = [
    {
      name: "ibrix_cookie_consent",
      provider: "IBRIX",
      purpose: t("legCookies.necessary.p1"),
      duration: t("legCookies.necessary.d1"),
    },
    {
      name: "sb-*-auth-token",
      provider: "Supabase",
      purpose: t("legCookies.necessary.p2"),
      duration: t("legCookies.necessary.d2"),
    },
    {
      name: "cf_clearance, __cf_bm",
      provider: "Cloudflare",
      purpose: t("legCookies.necessary.p3"),
      duration: t("legCookies.necessary.d3"),
    },
  ];

  const FUNCTIONAL: CookieRow[] = [
    {
      name: "ibrix_cart (localStorage)",
      provider: "IBRIX",
      purpose: t("legCookies.functional.p1"),
      duration: t("legCookies.functional.d1"),
    },
    {
      name: "theme (localStorage)",
      provider: "IBRIX",
      purpose: t("legCookies.functional.p2"),
      duration: t("legCookies.functional.d2"),
    },
  ];

  const ANALYTICS: CookieRow[] = [
    {
      name: "_ga",
      provider: "Google Analytics",
      purpose: t("legCookies.analytics.p1"),
      duration: t("legCookies.analytics.d1"),
    },
    {
      name: "_ga_*",
      provider: "Google Analytics",
      purpose: t("legCookies.analytics.p2"),
      duration: t("legCookies.analytics.d2"),
    },
    {
      name: "_gid",
      provider: "Google Analytics",
      purpose: t("legCookies.analytics.p3"),
      duration: t("legCookies.analytics.d3"),
    },
    {
      name: "_gat",
      provider: "Google Analytics",
      purpose: t("legCookies.analytics.p4"),
      duration: t("legCookies.analytics.d4"),
    },
    {
      name: "ibrix_utm_params (localStorage)",
      provider: "IBRIX",
      purpose: t("legCookies.analytics.p5"),
      duration: t("legCookies.analytics.d5"),
    },
  ];

  const MARKETING: CookieRow[] = [
    {
      name: "_fbp",
      provider: "Meta",
      purpose: t("legCookies.marketing.p1"),
      duration: t("legCookies.marketing.d1"),
    },
    {
      name: "_fbc",
      provider: "Meta",
      purpose: t("legCookies.marketing.p2"),
      duration: t("legCookies.marketing.d2"),
    },
    {
      name: "fr",
      provider: "Meta",
      purpose: t("legCookies.marketing.p3"),
      duration: t("legCookies.marketing.d3"),
    },
    {
      name: "_gcl_au",
      provider: "Google Ads",
      purpose: t("legCookies.marketing.p4"),
      duration: t("legCookies.marketing.d4"),
    },
    {
      name: "_ttp",
      provider: "TikTok",
      purpose: t("legCookies.marketing.p5"),
      duration: t("legCookies.marketing.d5"),
    },
  ];

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-2">{t("legCookies.title")}</h1>
          <p className="text-sm text-muted-foreground mb-10">
            {t("legCookies.updated", { date: COMPANY.updated })}
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <p className="lead text-foreground/80">
              {t("legCookies.lead", { site: COMPANY.site })}
            </p>

            <section>
              <h2 className={h2}>{t("legCookies.what.title")}</h2>
              <p>{t("legCookies.what.p1")}</p>
              <p>
                {t("legCookies.what.p2pre")} <strong>localStorage</strong> {t("legCookies.what.p2mid")}{" "}
                <strong>sessionStorage</strong>
                {t("legCookies.what.p2post")}
              </p>
              <p>
                {t("legCookies.what.p3pre")} <strong>{t("legCookies.what.p3own")}</strong>{" "}
                {t("legCookies.what.p3mid", { site: COMPANY.site })}{" "}
                <strong>{t("legCookies.what.p3third")}</strong> {t("legCookies.what.p3post")}
              </p>
            </section>

            <section>
              <h2 className={h2}>{t("legCookies.essential.title")}</h2>
              <p>
                {t("legCookies.essential.pre")} <strong>{t("legCookies.essential.em")}</strong>
                {t("legCookies.essential.post")}
              </p>
              <CookieTable rows={NECESSARY} />
            </section>

            <section>
              <h2 className={h2}>{t("legCookies.functionalSec.title")}</h2>
              <p>{t("legCookies.functionalSec.p1")}</p>
              <CookieTable rows={FUNCTIONAL} />
            </section>

            <section>
              <h2 className={h2}>{t("legCookies.analyticsSec.title")}</h2>
              <p>{t("legCookies.analyticsSec.p1")}</p>
              <p>
                {t("legCookies.analyticsSec.pre")} <strong>{t("legCookies.analyticsSec.em")}</strong>
                {t("legCookies.analyticsSec.post")}
              </p>
              <CookieTable rows={ANALYTICS} />
            </section>

            <section>
              <h2 className={h2}>{t("legCookies.marketingSec.title")}</h2>
              <p>{t("legCookies.marketingSec.p1")}</p>
              <p>
                {t("legCookies.marketingSec.pre")} <strong>{t("legCookies.marketingSec.em")}</strong>
                {t("legCookies.marketingSec.post")}
              </p>
              <CookieTable rows={MARKETING} />
              <p className="mt-4">
                {t("legCookies.marketingSec.pre3")}{" "}
                <Link to="/privatumo-politika" className="text-accent hover:underline">
                  {t("legCookies.marketingSec.link")}
                </Link>{" "}
                {t("legCookies.marketingSec.post3")}
              </p>
            </section>

            <section>
              <h2 className={h2}>{t("legCookies.choice.title")}</h2>
              <p>{t("legCookies.choice.p1")}</p>
              <button
                onClick={openModal}
                className="mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors not-prose"
              >
                {t("legCookies.choice.button")}
              </button>
              <p className="mt-6">
                {t("legCookies.choice.pre2")} <em>{t("legCookies.choice.em2")}</em> {t("legCookies.choice.post2")}
              </p>
              <p>
                {t("legCookies.choice.browsers")}{" "}
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Chrome</a>,{" "}
                <a href="https://support.mozilla.org/kb/slapukai-informacija-kuria-svetaines-issaugo-jusu" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Firefox</a>,{" "}
                <a href="https://support.apple.com/lt-lt/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Safari</a>,{" "}
                <a href="https://support.microsoft.com/topic/168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Edge</a>.
              </p>
            </section>

            <section>
              <h2 className={h2}>{t("legCookies.changes.title")}</h2>
              <p>{t("legCookies.changes.p1")}</p>
              <p>
                {t("legCookies.changes.pre")}{" "}
                <a href={`mailto:${COMPANY.email}`} className="text-accent hover:underline">
                  {COMPANY.email}
                </a>
                {t("legCookies.changes.mid")}{" "}
                <Link to="/privatumo-politika" className="text-accent hover:underline">
                  {t("legCookies.changes.privacyLink")}
                </Link>{" "}
                {t("legCookies.changes.and")}{" "}
                <Link to="/taisykles" className="text-accent hover:underline">
                  {t("legCookies.changes.termsLink")}
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
