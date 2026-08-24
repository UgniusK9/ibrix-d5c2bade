import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { COMPANY, companyLine } from "@/config/company";

export default function Taisykles() {
  const mailto = `mailto:${COMPANY.email}`;

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-2">Pirkimo taisyklės</h1>
          <p className="text-sm text-muted-foreground mb-10">Atnaujinta {COMPANY.updated}</p>

          <div className="prose prose-lg max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-heading prose-strong:text-foreground">
            <h2>1. Bendrosios nuostatos</h2>
            <p>
              1.1. Elektroninė parduotuvė {COMPANY.site} (toliau – Parduotuvė) priklauso ir yra
              administruojama {companyLine()} (toliau – Pardavėjas).
            </p>
            <p>
              1.2. Šios pirkimo taisyklės (toliau – Taisyklės) yra Pardavėjo ir Pirkėjo teisiškai
              privalomas dokumentas, kuriame nustatomos šalių teisės, pareigos, prekių įsigijimo,
              apmokėjimo, pristatymo bei grąžinimo sąlygos ir atsakomybė.
            </p>
            <p>
              1.3. Pirkti Parduotuvėje turi teisę veiksnūs fiziniai asmenys, nepilnamečiai nuo
              keturiolikos iki aštuoniolikos metų amžiaus, turintys tėvų ar globėjų sutikimą, taip
              pat juridiniai asmenys.
            </p>
            <p>
              1.4. Pateikdamas užsakymą Pirkėjas patvirtina, kad susipažino su Taisyklėmis ir su
              jomis sutinka. Su Taisyklėmis nesutinkantis asmuo neturi teisės pirkti Parduotuvėje.
            </p>
            <p>
              1.5. Pardavėjas turi teisę keisti Taisykles. Užsakymui taikoma ta Taisyklių redakcija,
              kuri galiojo užsakymo pateikimo metu.
            </p>

            <h2>2. Pirkimo–pardavimo sutarties sudarymas</h2>
            <p>
              2.1. Sutartis laikoma sudaryta nuo to momento, kai Pirkėjas suformuoja užsakymą, jį
              apmoka ir gauna Pardavėjo patvirtinimą el. paštu.
            </p>
            <p>
              2.2. Kiekviena sutartis saugoma Parduotuvės duomenų bazėje. Savo užsakymus Pirkėjas
              mato prisijungęs prie paskyros.
            </p>
            <p>
              2.3. Pardavėjas turi teisę atšaukti užsakymą, jeigu prekės nebeturima, jos kaina ar
              aprašymas buvo pateikti su akivaizdžia klaida arba užsakymo nepavyksta patvirtinti.
              Tokiu atveju sumokėta suma grąžinama per 14 (keturiolika) dienų.
            </p>

            <h2>3. Kainos ir apmokėjimas</h2>
            <p>
              3.1. Prekių kainos nurodytos eurais ir apima visus mokesčius. Pristatymo kaina, jeigu
              ji taikoma, nurodoma atskirai užsakymo formavimo metu.
            </p>
            <p>3.2. Užsakymui taikoma kaina, galiojusi užsakymo pateikimo momentu.</p>
            <p>
              3.3. Atsiskaitoma per {COMPANY.paymentProcessor} mokėjimų sistemą pasirenkant
              elektroninę bankininkystę ar kitą siūlomą būdą. Pardavėjas neturi prieigos prie Pirkėjo
              mokėjimo priemonių duomenų.
            </p>
            <p>3.4. Pirkėjo pageidavimu išrašoma sąskaita faktūra, kuri pateikiama el. paštu.</p>

            <h2>4. Išankstiniai užsakymai (pre-order)</h2>
            <p>
              4.1. Dalis prekių parduodama išankstinio užsakymo būdu. Tokios prekės aiškiai
              pažymėtos, o prie jų nurodomas orientacinis laukimo terminas savaitėmis.
            </p>
            <p>
              4.2. Pateikdamas išankstinį užsakymą Pirkėjas sumoka avansą. Likusi suma sumokama prieš
              prekės išsiuntimą, Pardavėjui apie tai pranešus el. paštu.
            </p>
            <p>
              4.3. Nurodomas laukimo terminas yra orientacinis ir priklauso nuo gamintojo. Terminui
              reikšmingai pailgėjus Pardavėjas informuoja Pirkėją, o Pirkėjas turi teisę atsisakyti
              užsakymo ir atgauti sumokėtą avansą.
            </p>
            <p>
              4.4. Išankstinį užsakymą Pirkėjas gali atšaukti bet kada iki prekės išsiuntimo.
              Sumokėtas avansas grąžinamas visas per 14 (keturiolika) dienų.
            </p>

            <h2>5. Prekių pristatymas</h2>
            <p>
              5.1. Prekės pristatomos į Pirkėjo pasirinktą paštomatą arba nurodytu adresu. Pristatymo
              būdai ir terminai nurodyti skiltyje <a href="/pristatymas">Pristatymas</a>.
            </p>
            <p>
              5.2. Pirkėjas įsipareigoja nurodyti tikslų pristatymo adresą. Dėl neteisingai nurodytų
              duomenų atsiradusias papildomas išlaidas apmoka Pirkėjas.
            </p>
            <p>
              5.3. Prekės atsitiktinio žuvimo ar sugedimo rizika pereina Pirkėjui nuo prekės
              atsiėmimo momento.
            </p>
            <p>
              5.4. Pastebėjęs pažeistą siuntos pakuotę, Pirkėjas turi tai pažymėti siuntos perdavimo
              dokumente arba nedelsdamas informuoti Pardavėją.
            </p>

            <h2>6. Teisė atsisakyti sutarties</h2>
            <p>
              6.1. Pirkėjas (vartotojas) turi teisę per 14 (keturiolika) dienų nuo prekės gavimo
              atsisakyti sutarties nenurodydamas priežasties.
            </p>
            <p>
              6.2. Apie sutarties atsisakymą pranešama el. paštu <a href={mailto}>{COMPANY.email}</a>
              . Grąžinimo tvarka aprašyta skiltyje <a href="/grazinimai">Grąžinimai</a>.
            </p>
            <p>
              6.3. Grąžinama prekė turi būti nenaudota, nesugadinta, nepraradusi prekinės išvaizdos
              ir originalioje pakuotėje. Surinktas konstruktorius nelaikomas nepraradusiu prekinės
              išvaizdos.
            </p>
            <p>
              6.4. Sumokėtus pinigus Pardavėjas grąžina ne vėliau kaip per 14 (keturiolika) dienų nuo
              prekės grąžinimo.
            </p>
            <p>6.5. Teisė atsisakyti sutarties netaikoma juridiniams asmenims.</p>

            <h2>7. Prekių kokybė ir garantija</h2>
            <p>
              7.1. Prekėms taikoma dvejų metų garantija pagal kokybės reikalavimus, numatytus
              Lietuvos Respublikos civiliniame kodekse.
            </p>
            <p>
              7.2. Nuotraukos yra iliustracinės. Prekės spalvos, forma ar kiti parametrai dėl
              monitoriaus nustatymų gali nežymiai skirtis nuo realių.
            </p>
            <p>
              7.3. Nustačius kokybės trūkumą Pirkėjas turi teisę reikalauti prekę pakeisti, sumažinti
              kainą arba nutraukti sutartį ir atgauti sumokėtus pinigus.
            </p>

            <h2>8. Trūkstamos detalės</h2>
            <p>
              8.1. Pastebėjus, kad rinkinyje trūksta detalės, Pardavėjas ją atsiunčia nemokamai.
              Pakanka nurodyti rinkinio numerį ir detalės numerį iš instrukcijos skiltyje{" "}
              <a href="/trukstamos-detales">Trūkstamos detalės</a>.
            </p>
            <p>
              8.2. Ši nuostata negali būti aiškinama kaip Pirkėjo teisių pagal 6 ir 7 skyrius
              ribojimas.
            </p>

            <h2>9. Šalių atsakomybė</h2>
            <p>
              9.1. Pirkėjas atsako už pateiktų duomenų teisingumą ir už prisijungimo duomenų
              saugojimą.
            </p>
            <p>
              9.2. Pardavėjas neatsako už kitų įmonių tinklalapiuose pateiktą informaciją, net jeigu
              Pirkėjas juos pasiekia per Parduotuvėje esančias nuorodas.
            </p>
            <p>
              9.3. Atsiradus žalai, kaltoji šalis atlygina kitos šalies patirtus tiesioginius
              nuostolius Lietuvos Respublikos teisės aktų nustatyta tvarka.
            </p>

            <h2>10. Asmens duomenys</h2>
            <p>
              10.1. Asmens duomenys tvarkomi vadovaujantis{" "}
              <a href="/privatumo-politika">Privatumo politika</a> ir Bendruoju duomenų apsaugos
              reglamentu (BDAR).
            </p>

            <h2>11. Ginčų sprendimas</h2>
            <p>
              11.1. Nesutarimai sprendžiami derybomis. Prašymą Pardavėjui galima pateikti el. paštu{" "}
              <a href={mailto}>{COMPANY.email}</a>; atsakymas pateikiamas per 14 (keturiolika) dienų.
            </p>
            <p>
              11.2. Nepavykus susitarti, vartotojas turi teisę kreiptis į {COMPANY.vvtat} (
              <a href={COMPANY.vvtatUrl} target="_blank" rel="noopener noreferrer">
                vvtat.lt
              </a>
              ) arba pasinaudoti Europos Komisijos elektronine ginčų sprendimo platforma (
              <a href={COMPANY.odrUrl} target="_blank" rel="noopener noreferrer">
                ec.europa.eu/odr
              </a>
              ).
            </p>
            <p>11.3. Ginčams taikoma Lietuvos Respublikos teisė.</p>

            <h2>12. Pardavėjo rekvizitai</h2>
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
              El. paštas: <a href={mailto}>{COMPANY.email}</a>
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
