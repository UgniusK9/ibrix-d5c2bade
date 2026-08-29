import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { Link } from "react-router-dom";
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

const NECESSARY: CookieRow[] = [
  {
    name: "ibrix_cookie_consent",
    provider: "IBRIX",
    purpose: "Įsimena jūsų slapukų pasirinkimą, kad nebūtų klausiama kaskart",
    duration: "1 metai",
  },
  {
    name: "sb-*-auth-token",
    provider: "Supabase",
    purpose: "Palaiko prisijungimo sesiją prie paskyros",
    duration: "Sesija / iki atsijungimo",
  },
  {
    name: "cf_clearance, __cf_bm",
    provider: "Cloudflare",
    purpose: "Turnstile apsauga nuo automatizuoto piktnaudžiavimo formose",
    duration: "iki 30 min.",
  },
];

const FUNCTIONAL: CookieRow[] = [
  {
    name: "ibrix_cart (localStorage)",
    provider: "IBRIX",
    purpose: "Išsaugo krepšelio turinį, kad neišnyktų perkraunant puslapį",
    duration: "Iki išvalymo",
  },
  {
    name: "theme (localStorage)",
    provider: "IBRIX",
    purpose: "Įsimena šviesią ar tamsią temą",
    duration: "Iki išvalymo",
  },
];

const ANALYTICS: CookieRow[] = [
  {
    name: "_ga",
    provider: "Google Analytics",
    purpose: "Atskiria unikalius lankytojus",
    duration: "2 metai",
  },
  {
    name: "_ga_*",
    provider: "Google Analytics",
    purpose: "Palaiko seanso būseną",
    duration: "2 metai",
  },
  {
    name: "_gid",
    provider: "Google Analytics",
    purpose: "Atskiria lankytojus per parą",
    duration: "24 val.",
  },
  {
    name: "_gat",
    provider: "Google Analytics",
    purpose: "Riboja užklausų dažnį",
    duration: "1 min.",
  },
  {
    name: "ibrix_utm_params (localStorage)",
    provider: "IBRIX",
    purpose:
      "Įsimena, iš kurios kampanijos atėjote, kad žinotume, kuri reklama veikia",
    duration: "Iki išvalymo",
  },
];

const MARKETING: CookieRow[] = [
  {
    name: "_fbp",
    provider: "Meta",
    purpose: "Matuoja reklamos efektyvumą ir sudaro auditorijas",
    duration: "3 mėn.",
  },
  {
    name: "_fbc",
    provider: "Meta",
    purpose: "Įsimena paspaudimą ant reklamos",
    duration: "3 mėn.",
  },
  {
    name: "fr",
    provider: "Meta",
    purpose: "Reklamos pateikimas ir matavimas",
    duration: "3 mėn.",
  },
  {
    name: "_gcl_au",
    provider: "Google Ads",
    purpose: "Susieja apsilankymą su reklamos paspaudimu (konversijų matavimas)",
    duration: "90 d.",
  },
  {
    name: "_ttp",
    provider: "TikTok",
    purpose: "Matuoja TikTok reklamos efektyvumą",
    duration: "13 mėn.",
  },
];

function CookieTable({ rows }: { rows: CookieRow[] }) {
  return (
    <div className="overflow-x-auto not-prose my-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 font-medium text-foreground">Pavadinimas</th>
            <th className="text-left py-2 pr-4 font-medium text-foreground">Teikėjas</th>
            <th className="text-left py-2 pr-4 font-medium text-foreground">Paskirtis</th>
            <th className="text-left py-2 font-medium text-foreground whitespace-nowrap">Galiojimas</th>
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
  const { openModal } = useCookieConsentStore();
  const h2 = "text-2xl font-heading font-semibold text-foreground mt-8 mb-4";

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-2">Slapukų politika</h1>
          <p className="text-sm text-muted-foreground mb-10">
            Atnaujinta {COMPANY.updated}
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <p className="lead text-foreground/80">
              Ši politika paaiškina, kokius slapukus ir panašias technologijas naudoja{" "}
              {COMPANY.site}, kam jie reikalingi, kiek galioja ir kaip pakeisti savo
              pasirinkimą.
            </p>

            <section>
              <h2 className={h2}>1. Kas yra slapukai</h2>
              <p>
                1.1. Slapukai (angl. cookies) – nedideli tekstiniai failai, kuriuos svetainė
                įrašo į jūsų įrenginį. Jie leidžia atpažinti naršyklę ir prisiminti jūsų
                veiksmus tarp apsilankymų.
              </p>
              <p>
                1.2. Naudojame ir panašias technologijas – <strong>localStorage</strong> bei{" "}
                <strong>sessionStorage</strong>. Techniškai tai ne slapukai, bet duomenys
                taip pat saugomi jūsų įrenginyje, todėl jiems taikome tas pačias taisykles ir
                nurodome juos šioje politikoje.
              </p>
              <p>
                1.3. Slapukai skirstomi į <strong>savus</strong> (įrašomus {COMPANY.site}) ir{" "}
                <strong>trečiųjų šalių</strong> (įrašomus Google, Meta, TikTok ar Cloudflare).
              </p>
            </section>

            <section>
              <h2 className={h2}>2. Būtinieji slapukai</h2>
              <p>
                2.1. Reikalingi svetainei veikti – krepšeliui, prisijungimui ir apsaugai nuo
                piktnaudžiavimo. Be jų parduotuvė neveiktų, todėl jie įrašomi{" "}
                <strong>be atskiro sutikimo</strong>, kaip leidžia teisės aktai.
              </p>
              <CookieTable rows={NECESSARY} />
            </section>

            <section>
              <h2 className={h2}>3. Funkciniai slapukai</h2>
              <p>
                3.1. Įsimena jūsų pasirinkimus ir daro naudojimąsi patogesnį. Juos išjungus
                svetainė veiks, bet kaskart teks rinktis iš naujo.
              </p>
              <CookieTable rows={FUNCTIONAL} />
            </section>

            <section>
              <h2 className={h2}>4. Analitikos slapukai</h2>
              <p>
                4.1. Padeda suprasti, kaip lankytojai naudojasi svetaine – kurie puslapiai
                populiarūs, kur žmonės pasimeta. Duomenys naudojami apibendrintai.
              </p>
              <p>
                4.2. Įrašomi <strong>tik gavus jūsų sutikimą</strong>. Kol sutikimo nėra,
                Google Analytics scenarijus net neįkeliamas.
              </p>
              <CookieTable rows={ANALYTICS} />
            </section>

            <section>
              <h2 className={h2}>5. Rinkodaros slapukai</h2>
              <p>
                5.1. Leidžia matuoti reklamos efektyvumą ir rodyti aktualesnę reklamą
                socialiniuose tinkluose bei paieškoje.
              </p>
              <p>
                5.2. Įrašomi <strong>tik gavus jūsų sutikimą rinkodarai</strong>. Atsisakius –
                Meta, TikTok ir Google Ads scenarijai neįkeliami.
              </p>
              <CookieTable rows={MARKETING} />
              <p className="mt-4">
                5.3. Dalis šių teikėjų gali tvarkyti duomenis už Europos ekonominės erdvės
                ribų. Plačiau –{" "}
                <Link to="/privatumo-politika" className="text-accent hover:underline">
                  Privatumo apsaugos taisyklių
                </Link>{" "}
                6 skyriuje.
              </p>
            </section>

            <section>
              <h2 className={h2}>6. Kaip pakeisti savo pasirinkimą</h2>
              <p>
                6.1. Sutikimą galite bet kada pakeisti arba atšaukti – mygtukas žemiau.
                Atšaukus sutikimą, atitinkami slapukai ištrinami, o scenarijai nebeįkeliami.
              </p>
              <button
                onClick={openModal}
                className="mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors not-prose"
              >
                Keisti slapukų nustatymus
              </button>
              <p className="mt-6">
                6.2. Slapukus galite valdyti ir naršyklės nustatymuose – ten juos peržiūrėti,
                ištrinti ar užblokuoti. Atkreipkite dėmesį: užblokavus <em>visus</em> slapukus,
                įskaitant būtinuosius, krepšelis ir prisijungimas nustos veikti.
              </p>
              <p>
                6.3. Naršyklių instrukcijos:{" "}
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Chrome</a>,{" "}
                <a href="https://support.mozilla.org/kb/slapukai-informacija-kuria-svetaines-issaugo-jusu" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Firefox</a>,{" "}
                <a href="https://support.apple.com/lt-lt/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Safari</a>,{" "}
                <a href="https://support.microsoft.com/topic/168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Edge</a>.
              </p>
            </section>

            <section>
              <h2 className={h2}>7. Politikos pakeitimai</h2>
              <p>
                7.1. Pridėjus ar pašalinus įrankį, ši politika atnaujinama. Data viršuje rodo
                paskutinį pakeitimą.
              </p>
              <p>
                7.2. Klausimus siųskite{" "}
                <a href={`mailto:${COMPANY.email}`} className="text-accent hover:underline">
                  {COMPANY.email}
                </a>
                . Taip pat skaitykite{" "}
                <Link to="/privatumo-politika" className="text-accent hover:underline">
                  Privatumo apsaugos taisykles
                </Link>{" "}
                ir{" "}
                <Link to="/taisykles" className="text-accent hover:underline">
                  Taisykles
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
