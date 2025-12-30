import { PageLayout } from "@/components/layout/PageLayout";
import { Link } from "react-router-dom";
import { useCookieConsentStore } from "@/stores/cookieConsentStore";

export default function SlapukaiPolitika() {
  const { openModal } = useCookieConsentStore();
  
  return (
    <PageLayout>
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-8">Slapukų politika</h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <p className="lead text-foreground/80">
              Ši slapukų politika paaiškina, kaip ibrix.lt naudoja slapukus ir panašias technologijas.
            </p>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Kas yra slapukai?
              </h2>
              <p>
                Slapukai (angl. cookies) yra maži tekstiniai failai, kuriuos svetainė išsaugo jūsų 
                įrenginyje (kompiuteryje, telefone ar planšetėje), kai ją lankote. Jie padeda 
                svetainei atsiminti jūsų veiksmus ir nustatymus.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Kokius slapukus naudojame?
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-2">Būtini slapukai</h3>
                  <p className="text-sm">
                    Reikalingi svetainės veikimui. Be jų svetainė neveiktų tinkamai. 
                    Tai apima sesijos identifikatorius, krepšelio duomenis ir saugumo slapukus.
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    Pavyzdžiai: session_id, ibrix_cookie_consent
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-2">Funkciniai slapukai</h3>
                  <p className="text-sm">
                    Padeda veikti pirkimo funkcijoms ir pagerina naudojimosi patogumą. 
                    Jei juos išjungsite, kai kurios funkcijos gali neveikti (pvz., krepšelis).
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-2">Analitikos slapukai</h3>
                  <p className="text-sm">
                    Padeda suprasti, kaip lankytojai naudojasi svetaine. Renkama anoniminė 
                    informacija apie lankomas puslapius ir praleidžiamą laiką.
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    Pavyzdžiai: Google Analytics (_ga, _gid)
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-2">Marketingo slapukai</h3>
                  <p className="text-sm">
                    Naudojami reklamos efektyvumui matuoti ir personalizuoti. 
                    Jie gali sekti jūsų veiklą įvairiose svetainėse.
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    Pavyzdžiai: Meta Pixel (_fbp), Google Ads
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Trečiosios šalys
              </h2>
              <p>
                Naudojame šių trečiųjų šalių paslaugas:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>
                  <strong>Stripe</strong> – mokėjimų apdorojimas. Stripe naudoja slapukus 
                  saugumui ir sukčiavimo prevencijai.
                </li>
                <li>
                  <strong>Google Analytics</strong> – svetainės lankomumo analizė 
                  (tik su jūsų sutikimu).
                </li>
                <li>
                  <strong>Meta (Facebook)</strong> – reklamos matavimas 
                  (tik su jūsų sutikimu).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Kaip pakeisti pasirinkimą?
              </h2>
              <p>
                Galite bet kada pakeisti savo slapukų nustatymus paspaudę mygtuką žemiau 
                arba naudodami nuorodą „Slapukų nustatymai" svetainės apačioje (footer).
              </p>
              <button
                onClick={openModal}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
              >
                Keisti slapukų nustatymus
              </button>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Naršyklės nustatymai
              </h2>
              <p>
                Taip pat galite valdyti slapukus per savo naršyklės nustatymus. 
                Dauguma naršyklių leidžia ištrinti slapukus arba užblokuoti naujų įrašymą.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-foreground mt-8 mb-4">
                Kontaktai
              </h2>
              <p>
                Jei turite klausimų apie slapukų naudojimą, susisiekite: {" "}
                <a href="mailto:support@ibrix.lt" className="text-accent hover:underline">
                  support@ibrix.lt
                </a>
              </p>
            </section>

            <div className="pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Taip pat žiūrėkite: {" "}
                <Link to="/privatumo-politika" className="text-accent hover:underline">
                  Privatumo politika
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
