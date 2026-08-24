import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { Link } from "react-router-dom";
import { useCookieConsentStore } from "@/stores/cookieConsentStore";
import { COMPANY, companyLine } from "@/config/company";

export default function PrivatumoPolitika() {
  const { openModal } = useCookieConsentStore();
  const mailto = `mailto:${COMPANY.email}`;
  const h2 = "text-2xl font-heading font-semibold text-foreground mt-8 mb-4";

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-2">
            Privatumo apsaugos taisyklės
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Atnaujinta {COMPANY.updated}
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <p className="lead text-foreground/80">
              Šios privatumo apsaugos taisyklės paaiškina, kokius asmens duomenis renka
              elektroninė parduotuvė {COMPANY.site}, kokiu tikslu ir teisiniu pagrindu juos
              tvarko, kam perduoda, kiek laiko saugo ir kokias teises turite jūs.
            </p>

            <section>
              <h2 className={h2}>1. Bendrosios nuostatos</h2>
              <p>
                1.1. Elektroninė parduotuvė {COMPANY.site} (toliau – Parduotuvė) priklauso ir yra
                administruojama {companyLine()} (toliau – IBRIX arba Duomenų valdytojas).
              </p>
              <p>
                1.2. Parduotuvėje prekiaujama MOULD KING ir kitų gamintojų konstruktoriais bei su
                jais susijusiomis prekėmis. Dalis prekių parduodama išankstinio užsakymo
                (pre-order) būdu, todėl kai kurie duomenys tvarkomi ilgesnį laiką nei įprastame
                pirkime – tai paaiškinta 9 skyriuje.
              </p>
              <p>
                1.3. Šios taisyklės taikomos visiems Parduotuvės lankytojams – tiek
                užsiregistravusiems, tiek naršantiems be paskyros (toliau – Lankytojas).
              </p>
              <p>
                1.4. Asmens duomenys tvarkomi vadovaujantis Europos Parlamento ir Tarybos
                reglamentu (ES) 2016/679 (Bendrasis duomenų apsaugos reglamentas, toliau – BDAR),
                Lietuvos Respublikos asmens duomenų teisinės apsaugos įstatymu ir Lietuvos
                Respublikos elektroninių ryšių įstatymu.
              </p>
              <p>
                1.5. Naudodamasis Parduotuve Lankytojas patvirtina, kad su šiomis taisyklėmis
                susipažino. Su jomis nesutinkantis asmuo Parduotuve naudotis negali.
              </p>
              <p>
                1.6. IBRIX turi teisę šias taisykles keisti. Pakeitimai įsigalioja juos paskelbus
                Parduotuvėje. Jeigu pakeitimai esminiai, apie juos pranešame el. paštu
                registruotiems Lankytojams.
              </p>
            </section>

            <section>
              <h2 className={h2}>2. Duomenų valdytojas ir kontaktai</h2>
              <p>2.1. Duomenų valdytojas:</p>
              <p>
                {COMPANY.legalName}
                <br />
                Juridinio asmens kodas: {COMPANY.regCode}
                {COMPANY.vatCode ? (
                  <>
                    <br />
                    PVM mokėtojo kodas: {COMPANY.vatCode}
                  </>
                ) : null}
                <br />
                Buveinės adresas: {COMPANY.address}, {COMPANY.country}
                <br />
                El. paštas:{" "}
                <a href={mailto} className="text-accent hover:underline">
                  {COMPANY.email}
                </a>
              </p>
              <p>
                2.2. Duomenų apsaugos pareigūnas nėra paskirtas, nes IBRIX veikla neatitinka BDAR
                37 straipsnyje nustatytų kriterijų. Visais duomenų apsaugos klausimais kreipkitės
                aukščiau nurodytu el. paštu.
              </p>
            </section>

            <section>
              <h2 className={h2}>3. Kokius duomenis renkame</h2>
              <p>
                3.1. <strong className="text-foreground">Registracijos duomenys.</strong> Kuriant
                paskyrą renkame vardą, pavardę, el. pašto adresą, telefono numerį ir slaptažodį.
                Slaptažodis saugomas tik šifruota (maišos funkcijos) forma – jo nematome nei mes,
                nei niekas kitas.
              </p>
              <p>
                3.2. <strong className="text-foreground">Užsakymo duomenys.</strong> Pateikiant
                užsakymą renkame vardą, pavardę, el. paštą, telefono numerį, pasirinktą paštomatą
                arba pristatymo adresą, užsakytas prekes, sumas, nuolaidos kodą ir užsakymo
                pastabas.
              </p>
              <p>
                3.3. <strong className="text-foreground">Sąskaitos faktūros duomenys.</strong>{" "}
                Pageidaujant sąskaitos juridiniam asmeniui – įmonės pavadinimą, įmonės kodą, PVM
                mokėtojo kodą ir adresą.
              </p>
              <p>
                3.4. <strong className="text-foreground">Mokėjimo duomenys.</strong> Mokėjimus
                vykdo {COMPANY.paymentProcessor}. Banko kortelės numerio, galiojimo datos ar CVV
                kodo IBRIX <strong className="text-foreground">nemato ir nesaugo</strong>. Matome
                tik mokėjimo faktą, sumą, valiutą, pasirinktą banką ir mokėjimo būseną.
              </p>
              <p>
                3.5. <strong className="text-foreground">Pristatymo duomenys.</strong> Siuntos
                numeris, kurjerio pateikta siuntos būsena ir pristatymo įvykiai.
              </p>
              <p>
                3.6. <strong className="text-foreground">Krepšelio duomenys.</strong> Į krepšelį
                įdėtos prekės ir krepšelio turinys – įskaitant nebaigtus užsakymus, kad galėtume
                priminti apie paliktą krepšelį, jeigu tam davėte sutikimą.
              </p>
              <p>
                3.7.{" "}
                <strong className="text-foreground">Kreditų ir dovanų kuponų duomenys.</strong>{" "}
                Kreditų likutis, jų panaudojimo istorija, įsigyti ar panaudoti dovanų kuponai.
              </p>
              <p>
                3.8. <strong className="text-foreground">Atsiliepimai.</strong> Paskelbtas
                atsiliepimo tekstas, vertinimas ir vardas, kurį pasirinkote rodyti. Atsiliepimai
                yra vieši.
              </p>
              <p>
                3.9. <strong className="text-foreground">Užklausos ir susirašinėjimas.</strong>{" "}
                Kontaktinės formos, trūkstamų detalių prašymai (rinkinio ir detalės numeriai),
                pranešimai apie prekės atsiradimą sandėlyje bei visas su tuo susijęs
                susirašinėjimas.
              </p>
              <p>
                3.10. <strong className="text-foreground">Naujienlaiškio duomenys.</strong> El.
                pašto adresas ir prenumeratos būsena, jeigu užsiprenumeravote.
              </p>
              <p>
                3.11. <strong className="text-foreground">Techniniai duomenys.</strong> IP adreso
                santrumpa, naršyklės ir įrenginio tipas, apsilankymo laikas, peržiūrėti puslapiai,
                nukreipiantis šaltinis ir kampanijos žymos (UTM). Šie duomenys renkami tik gavus
                jūsų sutikimą analitikai.
              </p>
              <p>
                3.12. IBRIX <strong className="text-foreground">nerenka</strong> specialių
                kategorijų asmens duomenų (sveikatos, religinių ar politinių pažiūrų, biometrinių
                duomenų) ir neprašo asmens kodo, išskyrus atvejus, kai jis privalomas juridinio
                asmens sąskaitai faktūrai išrašyti.
              </p>
            </section>

            <section>
              <h2 className={h2}>4. Teisiniai duomenų tvarkymo pagrindai</h2>
              <p>
                4.1. Kiekvienam tvarkymo tikslui taikomas konkretus BDAR 6 straipsnio pagrindas:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">Sutarties vykdymas</strong> (6 str. 1 d. b
                  p.) – užsakymo apdorojimas, apmokėjimas, pristatymas, garantija, grąžinimai,
                  paskyros administravimas.
                </li>
                <li>
                  <strong className="text-foreground">Teisinė prievolė</strong> (6 str. 1 d. c p.)
                  – apskaita, sąskaitų faktūrų išrašymas ir saugojimas, mokesčių reikalavimai.
                </li>
                <li>
                  <strong className="text-foreground">Sutikimas</strong> (6 str. 1 d. a p.) –
                  naujienlaiškis, analitikos ir rinkodaros slapukai, priminimai apie paliktą
                  krepšelį. Sutikimą galima bet kada atšaukti.
                </li>
                <li>
                  <strong className="text-foreground">Teisėtas interesas</strong> (6 str. 1 d. f
                  p.) – Parduotuvės saugumas, sukčiavimo prevencija, pretenzijų administravimas ir
                  paslaugos kokybės gerinimas.
                </li>
              </ul>
              <p className="mt-4">
                4.2. Sutikimo atšaukimas neturi įtakos iki atšaukimo atlikto tvarkymo teisėtumui.
              </p>
              <p>
                4.3. Duomenų pateikimas užsakymui yra būtinas sutarties sudarymo reikalavimas – be
                jų užsakymo įvykdyti negalime. Naujienlaiškio duomenys pateikiami savanoriškai.
              </p>
            </section>

            <section>
              <h2 className={h2}>5. Kam naudojame duomenis</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Užsakymams priimti, apdoroti, apmokėti ir pristatyti.</li>
                <li>
                  Išankstiniams (pre-order) užsakymams administruoti – informuoti apie laukimo
                  terminą ir pakviesti sumokėti likutį prieš išsiuntimą.
                </li>
                <li>Sąskaitoms faktūroms išrašyti ir apskaitai tvarkyti.</li>
                <li>Garantiniams klausimams, grąžinimams ir pretenzijoms nagrinėti.</li>
                <li>Trūkstamoms detalėms nemokamai atsiųsti.</li>
                <li>Klientų aptarnavimui ir atsakymams į užklausas.</li>
                <li>Kreditams ir dovanų kuponams administruoti.</li>
                <li>Naujienlaiškiui siųsti – tik su sutikimu.</li>
                <li>Parduotuvės veikimui, saugumui ir sukčiavimo prevencijai užtikrinti.</li>
                <li>Svetainės naudojimui analizuoti – tik su sutikimu.</li>
              </ul>
              <p className="mt-4">
                5.1. IBRIX <strong className="text-foreground">nepriima</strong> automatizuotų
                sprendimų, sukeliančių teisines pasekmes, ir nevykdo profiliavimo, kuris darytų
                reikšmingą poveikį Lankytojui.
              </p>
              <p>
                5.2. IBRIX <strong className="text-foreground">neparduoda</strong> ir jokia forma
                neperleidžia asmens duomenų tretiesiems asmenims reklamos tikslais.
              </p>
            </section>

            <section>
              <h2 className={h2}>6. Duomenų gavėjai</h2>
              <p>
                6.1. Duomenis perduodame tik tiek, kiek būtina paslaugai suteikti. Duomenų
                tvarkytojai veikia pagal sudarytas duomenų tvarkymo sutartis:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">{COMPANY.paymentProcessor}</strong> –
                  mokėjimų vykdymas (Lietuva, ES).
                </li>
                <li>
                  <strong className="text-foreground">Omniva, LP Express, DPD</strong> – siuntų
                  pristatymas. Perduodame vardą, pavardę, telefoną ir paštomato ar adreso duomenis.
                </li>
                <li>
                  <strong className="text-foreground">Supabase</strong> – duomenų bazės ir
                  autentifikacijos paslaugos, serveriai ES.
                </li>
                <li>
                  <strong className="text-foreground">Vercel</strong> – svetainės talpinimas ir
                  turinio pristatymo tinklas.
                </li>
                <li>
                  <strong className="text-foreground">Resend</strong> – operacinių ir informacinių
                  el. laiškų siuntimas.
                </li>
                <li>
                  <strong className="text-foreground">Cloudflare Turnstile</strong> – formų apsauga
                  nuo automatizuoto piktnaudžiavimo.
                </li>
                <li>
                  <strong className="text-foreground">Google Analytics</strong> – svetainės
                  analitika, tik su sutikimu.
                </li>
                <li>
                  <strong className="text-foreground">Meta, TikTok</strong> – rinkodaros efektyvumo
                  matavimas, tik su sutikimu rinkodarai.
                </li>
              </ul>
              <p className="mt-4">
                6.2. Duomenys taip pat gali būti perduoti buhalterinės apskaitos, teisinių ar audito
                paslaugų teikėjams bei valstybės institucijoms, kai to reikalauja teisės aktai.
              </p>
              <p>
                6.3. Dalis paslaugų teikėjų (pvz., Google, Meta, TikTok, Cloudflare) gali tvarkyti
                duomenis už Europos ekonominės erdvės ribų. Tokie perdavimai vykdomi remiantis
                Europos Komisijos standartinėmis sutarčių sąlygomis arba tinkamumo sprendimais.
              </p>
            </section>

            <section>
              <h2 className={h2}>7. Slapukai</h2>
              <p>
                7.1. Slapukai – nedideli tekstiniai failai, įrašomi į jūsų įrenginį. Naudojame
                keturias slapukų grupes: būtinuosius, funkcinius, analitinius ir rinkodaros.
              </p>
              <p>
                7.2. <strong className="text-foreground">Būtinieji</strong> slapukai reikalingi
                Parduotuvei veikti – krepšeliui, prisijungimui ir saugumui. Jie įrašomi be
                sutikimo, nes be jų paslauga neveiktų.
              </p>
              <p>
                7.3. Analitiniai ir rinkodaros slapukai įrašomi{" "}
                <strong className="text-foreground">tik gavus jūsų sutikimą</strong>. Kol sutikimo
                nėra, Google Analytics, Meta ir TikTok scenarijai net neįkeliami.
              </p>
              <p>
                7.4. Sutikimą galite bet kada pakeisti arba atšaukti. Atšaukus sutikimą, atitinkami
                slapukai ištrinami.
              </p>
              <p>
                7.5. Išsamų slapukų sąrašą rasite{" "}
                <Link to="/slapukai" className="text-accent hover:underline">
                  Slapukų politikoje
                </Link>
                .
              </p>
              <button
                onClick={openModal}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                Keisti slapukų nustatymus
              </button>
            </section>

            <section>
              <h2 className={h2}>8. Rinkodaros pranešimai</h2>
              <p>
                8.1. Naujienlaiškius ir pasiūlymus siunčiame tik turėdami jūsų sutikimą. Kiekviename
                laiške yra atsisakymo nuoroda, o atsisakyti galite ir parašę{" "}
                <a href={mailto} className="text-accent hover:underline">
                  {COMPANY.email}
                </a>
                .
              </p>
              <p>
                8.2. Su konkrečiu užsakymu susiję laiškai – patvirtinimas, išsiuntimo pranešimas,
                kvietimas sumokėti likutį už pre-order prekę – siunčiami visada. Tai sutarties
                vykdymas, o ne rinkodara.
              </p>
            </section>

            <section>
              <h2 className={h2}>9. Kiek laiko saugome duomenis</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-foreground">Užsakymų ir apskaitos duomenys</strong> – 10
                  metų nuo ūkinės operacijos, kaip reikalauja apskaitą reglamentuojantys teisės
                  aktai.
                </li>
                <li>
                  <strong className="text-foreground">Paskyros duomenys</strong> – kol paskyra
                  aktyvi. Ištrynus paskyrą duomenys pašalinami per 30 dienų, išskyrus tuos, kuriuos
                  privalome saugoti pagal teisės aktus.
                </li>
                <li>
                  <strong className="text-foreground">Pre-order užsakymų duomenys</strong> – kol
                  užsakymas įvykdomas arba atšaukiamas, vėliau taikomas bendras 10 metų terminas.
                </li>
                <li>
                  <strong className="text-foreground">Krepšelio duomenys</strong> – 30 dienų nuo
                  paskutinio veiksmo.
                </li>
                <li>
                  <strong className="text-foreground">Garantiniai ir grąžinimo duomenys</strong> – 2
                  metai nuo prekės pristatymo.
                </li>
                <li>
                  <strong className="text-foreground">Užklausos ir susirašinėjimas</strong> – 2
                  metai nuo paskutinio pranešimo.
                </li>
                <li>
                  <strong className="text-foreground">Naujienlaiškio duomenys</strong> – kol
                  atšaukiate prenumeratą.
                </li>
                <li>
                  <strong className="text-foreground">Slapukų sutikimas</strong> – 1 metai.
                </li>
                <li>
                  <strong className="text-foreground">Analitikos duomenys</strong> – iki 26 mėnesių.
                </li>
              </ul>
              <p className="mt-4">
                9.1. Pasibaigus terminui duomenys ištrinami arba nuasmeninami taip, kad konkretaus
                asmens nebebūtų galima nustatyti.
              </p>
            </section>

            <section>
              <h2 className={h2}>10. Jūsų teisės</h2>
              <p>10.1. Pagal BDAR turite šias teises:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">Susipažinti</strong> su tvarkomais savo
                  duomenimis ir gauti jų kopiją.
                </li>
                <li>
                  <strong className="text-foreground">Ištaisyti</strong> netikslius ar papildyti
                  neišsamius duomenis.
                </li>
                <li>
                  <strong className="text-foreground">Ištrinti</strong> duomenis („teisė būti
                  pamirštam"), kai jie nebereikalingi tikslui, dėl kurio buvo surinkti.
                </li>
                <li>
                  <strong className="text-foreground">Apriboti</strong> duomenų tvarkymą.
                </li>
                <li>
                  <strong className="text-foreground">Perkelti</strong> duomenis – gauti juos
                  susistemintu, kompiuterio skaitomu formatu.
                </li>
                <li>
                  <strong className="text-foreground">Nesutikti</strong> su tvarkymu, grindžiamu
                  teisėtu interesu.
                </li>
                <li>
                  <strong className="text-foreground">Atšaukti sutikimą</strong> bet kuriuo metu.
                </li>
              </ul>
              <p className="mt-4">
                10.2. Prašymą pateikite el. paštu{" "}
                <a href={mailto} className="text-accent hover:underline">
                  {COMPANY.email}
                </a>
                . Atsakome ne vėliau kaip per 30 kalendorinių dienų. Sudėtingais atvejais šis
                terminas gali būti pratęstas dar dviem mėnesiams jus informavus.
              </p>
              <p>
                10.3. Siekdami apsaugoti jūsų duomenis, galime paprašyti patvirtinti tapatybę –
                pavyzdžiui, pateikti prašymą iš to paties el. pašto, kuris nurodytas paskyroje.
              </p>
              <p>
                10.4. Teisė ištrinti duomenis nėra absoliuti. Užsakymų ir apskaitos duomenų
                negalime ištrinti nepasibaigus teisės aktų nustatytam saugojimo terminui.
              </p>
              <p>
                10.5. Manydami, kad jūsų teisės pažeistos, turite teisę pateikti skundą Valstybinei
                duomenų apsaugos inspekcijai (
                <a
                  href="https://vdai.lrv.lt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  vdai.lrv.lt
                </a>
                ). Prieš tai kviečiame kreiptis tiesiogiai į mus – dažniausiai klausimą pavyksta
                išspręsti greičiau.
              </p>
            </section>

            <section>
              <h2 className={h2}>11. Duomenų saugumo priemonės</h2>
              <p>11.1. Taikome technines ir organizacines priemones, proporcingas rizikai:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Visas duomenų perdavimas šifruojamas SSL/TLS protokolu.</li>
                <li>Slaptažodžiai saugomi tik vienkryptės maišos funkcijos forma.</li>
                <li>
                  Mokėjimo kortelių duomenys tvarkomi tik PCI DSS sertifikuoto mokėjimų partnerio
                  aplinkoje – į mūsų sistemas jie nepatenka.
                </li>
                <li>
                  Prieigą prie duomenų turi tik įgalioti asmenys, taikoma eilučių lygio prieigos
                  kontrolė duomenų bazėje.
                </li>
                <li>Vykdomas prieigos ir veiksmų registravimas.</li>
              </ul>
              <p className="mt-4">
                11.2. Prašome saugoti savo prisijungimo duomenis ir jų niekam neatskleisti.
                Naudodamiesi viešai prieinamu kompiuteriu, baigę darbą atsijunkite.
              </p>
              <p>
                11.3. IBRIX niekada neprašo atsiųsti slaptažodžio, banko kortelės numerio ar
                internetinės bankininkystės kodų el. paštu ar telefonu. Gavę tokį prašymą – tai
                sukčiavimas; praneškite mums.
              </p>
              <p>
                11.4. Nors taikome visas pagrįstas apsaugos priemones, duomenų perdavimas internetu
                niekada nėra visiškai saugus, todėl absoliutaus saugumo garantuoti negalime.
              </p>
              <p>
                11.5. Nustatę asmens duomenų saugumo pažeidimą, galintį kelti didelę riziką jūsų
                teisėms, informuosime jus ir Valstybinę duomenų apsaugos inspekciją per 72 valandas,
                kaip numato BDAR.
              </p>
            </section>

            <section>
              <h2 className={h2}>12. Nepilnamečių duomenys</h2>
              <p>
                12.1. Parduotuvėje parduodami konstruktoriai dažnai skirti vaikams, tačiau pirkti
                gali tik veiksnūs asmenys. Nepilnamečiai nuo 14 iki 18 metų gali pirkti tik turėdami
                tėvų ar globėjų sutikimą.
              </p>
              <p>
                12.2. Sąmoningai nerenkame jaunesnių nei 14 metų asmenų duomenų. Sužinoję, kad tokie
                duomenys buvo pateikti be tėvų sutikimo, juos nedelsdami ištriname.
              </p>
              <p>
                12.3. Tėvai ar globėjai, pastebėję, kad jų vaikas pateikė mums duomenis, gali
                kreiptis nurodytu el. paštu ir prašyti juos ištrinti.
              </p>
            </section>

            <section>
              <h2 className={h2}>13. Baigiamosios nuostatos</h2>
              <p>13.1. Šioms taisyklėms taikoma Lietuvos Respublikos teisė.</p>
              <p>
                13.2. Parduotuvėje gali būti nuorodų į kitų asmenų svetaines. IBRIX neatsako už tų
                svetainių privatumo praktiką – susipažinkite su jų taisyklėmis atskirai.
              </p>
              <p>
                13.3. Jeigu kuri nors šių taisyklių nuostata pripažįstama negaliojančia, tai neturi
                įtakos likusių nuostatų galiojimui.
              </p>
              <p>
                13.4. Klausimus dėl šių taisyklių siųskite{" "}
                <a href={mailto} className="text-accent hover:underline">
                  {COMPANY.email}
                </a>
                . Taip pat skaitykite{" "}
                <Link to="/taisykles" className="text-accent hover:underline">
                  Taisykles
                </Link>{" "}
                ir{" "}
                <Link to="/slapukai" className="text-accent hover:underline">
                  Slapukų politiką
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
