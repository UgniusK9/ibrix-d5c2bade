import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { Link } from "react-router-dom";
import { useCookieConsentStore } from "@/stores/cookieConsentStore";

export default function PrivatumoPolitika() {
  const { openModal } = useCookieConsentStore();
  
  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-8">Privatumo politika</h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <p className="lead text-foreground/80">
              Ši privatumo politika aprašo, kaip ibrix.lt renka, naudoja ir saugo jūsų asmeninę informaciją.
            </p>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Duomenų valdytojas
              </h2>
              <p>
                Už jūsų duomenų tvarkymą atsakinga IBRIX (įmonės duomenys bus nurodyti 
                po oficialios registracijos).
              </p>
              <p>
                Kontaktinis el. paštas privatumo klausimais: {" "}
                <a href="mailto:support@ibrix.lt" className="text-accent hover:underline">
                  support@ibrix.lt
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Kokius duomenis renkame?
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Vardas ir pavardė</strong> – užsakymų apdorojimui</li>
                <li><strong>El. pašto adresas</strong> – komunikacijai ir užsakymų patvirtinimui</li>
                <li><strong>Telefono numeris</strong> – pristatymo klausimais (neprivaloma)</li>
                <li><strong>Pristatymo adresas</strong> – prekių pristatymui</li>
                <li><strong>Mokėjimo informacija</strong> – apdorojama saugiai per Stripe</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Kam naudojame jūsų informaciją?
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Užsakymų apdorojimui ir pristatymui</li>
                <li>Komunikacijai apie užsakymo būseną</li>
                <li>Klientų aptarnavimui ir problemų sprendimui</li>
                <li>Teisiniams reikalavimams vykdyti (buhalterija, mokesčiai)</li>
                <li>Svetainės tobulinimui (tik su jūsų sutikimu – analitika)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Kiek laiko saugome duomenis?
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Užsakymų duomenys</strong> – 10 metų (teisiniai reikalavimai)</li>
                <li><strong>Krepšelio sesijos</strong> – 30 dienų neaktyvumo</li>
                <li><strong>Slapukų sutikimai</strong> – 1 metai</li>
                <li><strong>Analitikos duomenys</strong> – 26 mėnesiai (Google Analytics)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Duomenų perdavimas trečiosioms šalims
              </h2>
              <p>
                Jūsų duomenis perduodame tik šiems patikimiems partneriams:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>
                  <strong>Stripe</strong> – mokėjimų apdorojimas 
                  (ES/JAV, atitinka GDPR reikalavimus)
                </li>
                <li>
                  <strong>Omniva, LP EXPRESS, DPD</strong> – siuntų pristatymas
                </li>
                <li>
                  <strong>Google Analytics</strong> – svetainės analizė (tik su sutikimu)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Jūsų teisės
              </h2>
              <p>Pagal GDPR turite šias teises:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li><strong>Prieiga</strong> – gauti savo duomenų kopiją</li>
                <li><strong>Taisymas</strong> – patikslinti netikslius duomenis</li>
                <li><strong>Ištrynimas</strong> – prašyti ištrinti duomenis („teisė būti pamirštam")</li>
                <li><strong>Apribojimas</strong> – apriboti duomenų tvarkymą</li>
                <li><strong>Perkėlimas</strong> – gauti duomenis struktūrizuotu formatu</li>
                <li><strong>Prieštaravimas</strong> – nesutikti su tam tikru duomenų tvarkymu</li>
              </ul>
              <p className="mt-4">
                Norėdami pasinaudoti šiomis teisėmis, rašykite: {" "}
                <a href="mailto:support@ibrix.lt" className="text-accent hover:underline">
                  support@ibrix.lt
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Slapukai
              </h2>
              <p>
                Naudojame slapukus svetainės veikimui, analitikai ir marketingui. 
                Išsamią informaciją rasite {" "}
                <Link to="/slapukai" className="text-accent hover:underline">
                  Slapukų politikoje
                </Link>.
              </p>
              <button
                onClick={openModal}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                Keisti slapukų nustatymus
              </button>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Duomenų saugumas
              </h2>
              <p>
                Taikome technines ir organizacines priemones jūsų duomenų apsaugai:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>SSL/TLS šifravimas visiems duomenų perdavimams</li>
                <li>Mokėjimų duomenys tvarkomi PCI DSS sertifikuotų partnerių</li>
                <li>Prieigos kontrolė ir veiksmų registravimas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Kontaktai
              </h2>
              <p>
                Jei turite klausimų apie privatumo politiką ar norite pasinaudoti 
                savo teisėmis, susisiekite:
              </p>
              <p className="mt-2">
                El. paštas: {" "}
                <a href="mailto:support@ibrix.lt" className="text-accent hover:underline">
                  support@ibrix.lt
                </a>
              </p>
              <p className="mt-4 text-sm">
                Taip pat turite teisę pateikti skundą Valstybinei duomenų apsaugos 
                inspekcijai (ada.lt).
              </p>
            </section>

            <div className="pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Paskutinis atnaujinimas: {new Date().toLocaleDateString('lt-LT')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
