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
          <h1 className="font-heading text-4xl font-bold mb-2">Taisyklės</h1>
          <p className="text-sm text-muted-foreground mb-10">Atnaujinta {COMPANY.updated}</p>

          <div className="prose prose-lg max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-heading prose-strong:text-foreground">
            <h2 className="!mt-0">Pirkimo taisyklės</h2>

            <h3>1. Bendrosios nuostatos</h3>
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

            <h3>2. Pirkimo–pardavimo sutarties sudarymas</h3>
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

            <h3>3. Kainos ir apmokėjimas</h3>
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

            <h3>4. Išankstiniai užsakymai (pre-order)</h3>
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

            <h3>5. Prekių pristatymas</h3>
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

            <h3>6. Teisė atsisakyti sutarties</h3>
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

            <h3>7. Prekių kokybė ir garantija</h3>
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

            <h3>8. Trūkstamos detalės</h3>
            <p>
              8.1. Pastebėjus, kad rinkinyje trūksta detalės, Pardavėjas ją atsiunčia nemokamai.
              Pakanka nurodyti rinkinio numerį ir detalės numerį iš instrukcijos skiltyje{" "}
              <a href="/trukstamos-detales">Trūkstamos detalės</a>.
            </p>
            <p>
              8.2. Ši nuostata negali būti aiškinama kaip Pirkėjo teisių pagal 6 ir 7 skyrius
              ribojimas.
            </p>

            <h3>9. Šalių atsakomybė</h3>
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

            <h3>10. Asmens duomenys</h3>
            <p>
              10.1. Asmens duomenys tvarkomi vadovaujantis{" "}
              <a href="/privatumo-politika">Privatumo politika</a> ir Bendruoju duomenų apsaugos
              reglamentu (BDAR).
            </p>

            <h3>11. Ginčų sprendimas</h3>
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

            <h3>12. Pardavėjo rekvizitai</h3>
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

            <hr className="my-12" />

            <h2 className="!mt-0">Naudojimosi svetaine taisyklės</h2>
            <h3>1. Bendrosios nuostatos</h3>
            <p>
              1.1. Šios naudojimosi svetaine taisyklės (toliau – Naudojimosi taisyklės) nustato
              Parduotuvės lankymo, paskyros naudojimo ir turinio naudojimo sąlygas. Jos taikomos
              visiems Lankytojams – tiek pirkusiems, tiek tik naršantiems.
            </p>
            <p>
              1.2. Naudodamasis Parduotuve Lankytojas besąlygiškai įsipareigoja laikytis visų
              Naudojimosi taisyklėse nustatytų reikalavimų. Nesutinkantis asmuo neturi teisės
              naudotis Parduotuve.
            </p>
            <p>
              1.3. Naudojimosi taisyklėse vartojamos sąvokos turi tą pačią reikšmę kaip ir Pirkimo
              taisyklėse, išskyrus atvejus, kai jos apibrėžiamos atskirai.
            </p>
            <p>
              1.4. Pardavėjas turi teisę bet kada vienašališkai keisti ir papildyti Naudojimosi
              taisykles. Pakeitimai įsigalioja juos paskelbus Parduotuvėje.
            </p>
            <p>
              1.5. Jeigu po pakeitimų paskelbimo Lankytojas toliau naudojasi Parduotuve, laikoma,
              kad jis su pakeitimais sutinka. Nesutinkantis Lankytojas turi nustoti naudotis
              Parduotuve ir gali prašyti ištrinti savo paskyrą.
            </p>
            <p>
              1.6. Pardavėjas turi teisę bet kada keisti Parduotuvės funkcijas, dizainą, prekių
              asortimentą, kainas ir bet kokį turinį be atskiro įspėjimo. Tai neturi įtakos jau
              patvirtintiems užsakymams – jiems galioja užsakymo metu buvusios sąlygos.
            </p>
            <p>
              1.7. Parduotuvė teikiama tokia, kokia yra tuo metu. Pardavėjas nesuteikia garantijos,
              kad Parduotuvė veiks nepertraukiamai ar be klaidų, tačiau deda pagrįstas pastangas
              sutrikimams pašalinti.
            </p>

            <h3>2. Registracija ir paskyra</h3>
            <p>
              2.1. Dalimi Parduotuvės funkcijų – užsakymų istorija, kreditais, pageidavimų sąrašu –
              galima naudotis tik susikūrus paskyrą. Registruojantis pateikiami vardas, pavardė,
              el. pašto adresas, telefono numeris ir slaptažodis.
            </p>
            <p>
              2.2. Lankytojas įsipareigoja pateikti teisingus ir išsamius duomenis, o jiems
              pasikeitus – nedelsdamas juos atnaujinti. Pardavėjas neatsako už pasekmes, kilusias dėl
              neteisingų ar pasenusių duomenų.
            </p>
            <p>
              2.3. Lankytojas atsako už savo prisijungimo duomenų slaptumą ir už visus veiksmus,
              atliktus prisijungus prie jo paskyros. Įtaręs neteisėtą prisijungimą, Lankytojas
              privalo nedelsdamas pakeisti slaptažodį ir informuoti Pardavėją.
            </p>
            <p>
              2.4. Vienas asmuo gali turėti tik vieną paskyrą. Draudžiama kurti paskyras kito asmens
              vardu ar naudojantis netikrais duomenimis.
            </p>
            <p>
              2.5. Paskyrą galima bet kada ištrinti parašius el. paštu{" "}
              <a href={mailto}>{COMPANY.email}</a>. Ištrynus paskyrą duomenys pašalinami, išskyrus
              tuos, kuriuos privaloma saugoti pagal teisės aktus – tai aprašyta{" "}
              <a href="/privatumo-politika">Privatumo apsaugos taisyklėse</a>.
            </p>

            <h3>3. Pardavėjo ir Lankytojo teisės bei pareigos</h3>
            <p>
              3.1. Lankytojas įsipareigoja naudotis Parduotuve sąžiningai, teisėtais tikslais ir
              nepažeisdamas trečiųjų asmenų teisių.
            </p>
            <p>3.2. Lankytojui draudžiama:</p>
            <ul>
              <li>
                trikdyti Parduotuvės veikimą, bandyti gauti neteisėtą prieigą prie sistemų, duomenų
                bazių ar kitų Lankytojų paskyrų;
              </li>
              <li>
                naudoti automatines duomenų rinkimo, kopijavimo ar užsakymų teikimo priemones be
                išankstinio rašytinio Pardavėjo sutikimo;
              </li>
              <li>
                platinti kenkėjišką programinę įrangą, brukalą ar kitokį nepageidaujamą turinį;
              </li>
              <li>
                skelbti neteisingus, įžeidžiančius, šmeižiančius ar teisės aktams prieštaraujančius
                atsiliepimus bei komentarus;
              </li>
              <li>
                naudoti Parduotuvės turinį komerciniais tikslais be Pardavėjo sutikimo.
              </li>
            </ul>
            <p>
              3.3. Lankytojas atsako už visą informaciją, kurią pateikia Parduotuvėje – užsakymo
              duomenis, atsiliepimus, užklausas ir kitą medžiagą.
            </p>
            <p>
              3.4. Pateikdamas atsiliepimą Lankytojas patvirtina, kad jis yra tikras, pagrįstas
              asmenine patirtimi ir nepažeidžia trečiųjų asmenų teisių.
            </p>
            <p>
              3.5. Pardavėjas turi teisę nepaskelbti arba pašalinti atsiliepimą, kuris neatitinka
              3.2 ar 3.4 punktų, tačiau neredaguoja atsiliepimų turinio siekdamas pagerinti bendrą
              vertinimą.
            </p>
            <p>
              3.6. Pardavėjas turi teisę apriboti arba sustabdyti Lankytojo galimybę naudotis
              Parduotuve, jeigu Lankytojas pažeidžia Taisykles. Apie tai Lankytojas informuojamas
              jo nurodytu el. paštu, nurodant priežastį.
            </p>
            <p>
              3.7. Prieš apribojant paskyrą dėl neesminio pažeidimo Pardavėjas paprastai kreipiasi
              į Lankytoją ir suteikia galimybę pažeidimą pašalinti.
            </p>
            <p>
              3.8. Paskyros apribojimas neturi įtakos jau apmokėtiems užsakymams – jie vykdomi
              įprasta tvarka arba, jeigu tai neįmanoma, sumokėtos sumos grąžinamos.
            </p>
            <p>
              3.9. Pardavėjas įsipareigoja sudaryti sąlygas naudotis Parduotuve, vykdyti priimtus
              užsakymus ir aptarnauti Lankytojus lietuvių kalba.
            </p>
            <p>
              3.10. Pardavėjas įsipareigoja gerbti Lankytojo privatumą ir tvarkyti asmens duomenis
              tik taip, kaip aprašyta{" "}
              <a href="/privatumo-politika">Privatumo apsaugos taisyklėse</a>.
            </p>
            <p>
              3.11. Susidarius svarbioms aplinkybėms Pardavėjas gali laikinai arba visam laikui
              nutraukti Parduotuvės veiklą, apie tai iš anksto pranešęs Lankytojams ir įvykdęs arba
              grąžinęs apmokėtus užsakymus.
            </p>
            <p>
              3.12. Lankytojas turi teisę bet kada nustoti naudotis Parduotuve. Tai neatleidžia nuo
              pareigų, atsiradusių iki tokio sprendimo.
            </p>

            <h3>4. Prekių užsakymas Parduotuvėje</h3>
            <p>
              4.1. Norimas prekes Lankytojas randa elektroniniame kataloge, kuriame prekės suskirstytos
              pagal kategorijas. Prie kiekvienos prekės nurodoma kaina, būklė (sandėlyje ar
              išankstinis užsakymas) ir pagrindinė informacija.
            </p>
            <p>
              4.2. Kainos nurodomos eurais su visais mokesčiais. Pristatymo kaina į prekės kainą
              neįskaičiuota ir nurodoma atskirai formuojant užsakymą.
            </p>
            <p>
              4.3. Pasirinktas prekes Lankytojas deda į krepšelį, o užsakymą pateikia paspaudęs
              atitinkamą mygtuką ir užpildęs privalomus laukus.
            </p>
            <p>
              4.4. Formuodamas užsakymą Lankytojas nurodo pristatymo būdą, paštomatą arba adresą ir
              pasirenka apmokėjimo būdą. Lankytojas atsako už pateiktų duomenų teisingumą.
            </p>
            <p>
              4.5. Prieš patvirtindamas užsakymą Lankytojas gali peržiūrėti ir pataisyti krepšelio
              turinį, pristatymo duomenis bei pasirinktą apmokėjimo būdą.
            </p>
            <p>
              4.6. Užsakymas patvirtinamas atlikus mokėjimą. Sandėlyje esančioms prekėms sumokama
              visa kaina, o išankstinio užsakymo prekėms – avansas, likutį sumokant prieš išsiuntimą.
            </p>
            <p>
              4.7. Pateikdamas išankstinį (pre-order) užsakymą Lankytojas supranta, kad iki prekės
              gavimo iš gamintojo tarp šalių galioja preliminari sutartis dėl prekės rezervavimo.
              Galutinė pirkimo–pardavimo sutartis laikoma sudaryta apmokėjus likutį ir išsiuntus
              prekę.
            </p>
            <p>
              4.8. Gavęs mokėjimą Pardavėjas patvirtina užsakymą el. paštu ir pradeda jį vykdyti.
              Užsakymo būseną Lankytojas gali stebėti prisijungęs prie paskyros.
            </p>
            <p>
              4.9. Prekių kiekiai ir aprašymai remiasi gamintojo bei tiekėjų pateikta informacija.
              Retais atvejais kaina, likutis ar aprašymas gali būti pateikti su akivaizdžia klaida –
              tokiu atveju Pardavėjas turi teisę užsakymo nevykdyti, grąžindamas visas iš Lankytojo
              gautas sumas.
            </p>
            <p>
              4.10. Prekių kokybės, garantijos ir grąžinimo klausimus reglamentuoja šio dokumento
              Pirkimo taisyklės bei skiltys{" "}
              <a href="/grazinimai">Grąžinimai</a> ir <a href="/garantija">Garantija</a>.
            </p>

            <h3>5. Intelektinės nuosavybės apsauga</h3>
            <p>
              5.1. Visos teisės į Parduotuvės turinį – tekstus, dizainą, programinį kodą,
              nuotraukas, grafiką, duomenų bazių struktūrą ir kitą medžiagą – priklauso Pardavėjui
              arba yra naudojamos teisėtai.
            </p>
            <p>
              5.2. Draudžiama kopijuoti, atgaminti, platinti, viešai skelbti ar kitaip naudoti
              Parduotuvės turinį komerciniais tikslais be išankstinio rašytinio Pardavėjo sutikimo.
            </p>
            <p>
              5.3. Lankytojas gali peržiūrėti, atsispausdinti ar išsaugoti turinį asmeniniam,
              nekomerciniam naudojimui, nepašalindamas autorių teisių žymų.
            </p>
            <p>
              5.4. MOULD KING ir kiti Parduotuvėje minimi prekių ženklai priklauso jų savininkams ir
              naudojami tik prekėms identifikuoti. Jų naudojimas nereiškia, kad ženklo savininkas
              remia ar yra susijęs su Pardavėju kitaip nei kaip prekių tiekėjas.
            </p>
            <p>
              5.5. Pateikdamas atsiliepimą ar nuotrauką Lankytojas suteikia Pardavėjui neatlygintinę
              teisę juos skelbti Parduotuvėje. Šią teisę galima atšaukti paprašius pašalinti turinį.
            </p>

            <h3>6. Atsakomybės ribojimas</h3>
            <p>
              6.1. Pardavėjas neatsako už Parduotuvės veikimo sutrikimus, kilusius dėl nuo jo
              nepriklausančių aplinkybių – interneto ryšio, Lankytojo įrangos, trečiųjų asmenų
              paslaugų teikėjų veiklos ar nenugalimos jėgos aplinkybių.
            </p>
            <p>
              6.2. Pardavėjas neatsako už kitų asmenų svetainių, į kurias vedamos nuorodos iš
              Parduotuvės, turinį, veikimą ar privatumo praktiką.
            </p>
            <p>
              6.3. Pardavėjas neatsako už žalą, kilusią dėl to, kad Lankytojas nesilaikė Taisyklių,
              pateikė neteisingus duomenis arba neapsaugojo savo prisijungimo duomenų.
            </p>
            <p>
              6.4. Pardavėjas neatsako už kitų Lankytojų paskelbtų atsiliepimų turinį, tačiau
              pašalina turinį, neatitinkantį 3.2 ir 3.4 punktų, apie jį sužinojęs.
            </p>
            <p>
              6.5. Nuotraukos yra iliustracinės. Prekės spalva, atspalvis ar smulkios detalės dėl
              monitoriaus nustatymų ar gamintojo pakeitimų gali nežymiai skirtis nuo realių.
            </p>
            <p>
              6.6. <strong>Šiame skyriuje nustatyti atsakomybės ribojimai netaikomi tiek, kiek jie
              prieštarautų vartotojo teisėms, garantuojamoms imperatyviomis Lietuvos Respublikos ir
              Europos Sąjungos teisės normomis.</strong> Pardavėjas visais atvejais atsako už žalą,
              padarytą tyčia ar dėl didelio neatsargumo, taip pat už prekių kokybę ir atitiktį
              sutarčiai.
            </p>

            <h3>7. Pranešimų siuntimas</h3>
            <p>
              7.1. Pardavėjas siunčia pranešimus Lankytojo registracijos ar užsakymo metu nurodytu
              el. pašto adresu, o prireikus – telefonu.
            </p>
            <p>
              7.2. Lankytojas atsako už tai, kad nurodytas el. pašto adresas veiktų ir būtų
              tikrinamas. Pardavėjas neatsako už interneto ryšio ar el. pašto tiekėjų sutrikimus,
              dėl kurių Lankytojas negauna pranešimų, įskaitant patekimą į brukalo aplanką.
            </p>
            <p>
              7.3. Su užsakymu susiję pranešimai – patvirtinimas, išsiuntimas, kvietimas sumokėti
              likutį – siunčiami visada, nes yra būtini sutarčiai vykdyti.
            </p>
            <p>
              7.4. Rinkodaros pranešimai siunčiami tik su atskiru sutikimu, kurį galima bet kada
              atšaukti nuoroda laiške arba parašius <a href={mailto}>{COMPANY.email}</a>.
            </p>
            <p>
              7.5. Visus pranešimus, prašymus ir klausimus Lankytojas siunčia skiltyje{" "}
              <a href="/kontaktai">Kontaktai</a> nurodytais adresais.
            </p>

            <h3>8. Baigiamosios nuostatos</h3>
            <p>8.1. Naudojimosi taisyklėms taikoma Lietuvos Respublikos teisė.</p>
            <p>
              8.2. Jeigu kuri nors nuostata pripažįstama negaliojančia, tai neturi įtakos likusių
              nuostatų galiojimui. Negaliojanti nuostata pakeičiama galiojančia, kiek įmanoma
              artimesne pradinei prasmei.
            </p>
            <p>
              8.3. Pardavėjas turi teisę perleisti savo teises ir pareigas trečiajam asmeniui
              reorganizavimo ar verslo perleidimo atveju. Toks perleidimas negali pabloginti
              vartotojo padėties, o apie jį Lankytojai informuojami iš anksto.
            </p>
            <p>
              8.4. Taisyklės turi viršenybę prieš Parduotuvėje pateiktus paaiškinimus ir aprašymus,
              išskyrus atvejus, kai konkreti prekės ar akcijos sąlyga yra palankesnė Lankytojui.
            </p>
            <p>
              8.5. Nesutarimai sprendžiami derybomis. Prašymą Pardavėjui galima pateikti el. paštu{" "}
              <a href={mailto}>{COMPANY.email}</a>; atsakymas pateikiamas per 14 (keturiolika)
              dienų.
            </p>
            <p>
              8.6. Nepavykus susitarti, vartotojas turi teisę kreiptis į {COMPANY.vvtat} (
              <a href={COMPANY.vvtatUrl} target="_blank" rel="noopener noreferrer">
                vvtat.lt
              </a>
              ) arba pasinaudoti Europos Komisijos elektronine ginčų sprendimo platforma (
              <a href={COMPANY.odrUrl} target="_blank" rel="noopener noreferrer">
                ec.europa.eu/odr
              </a>
              ). Kreipimasis į šias institucijas neatima teisės kreiptis į teismą.
            </p>

          </div>
        </div>
      </section>
    </PageLayout>
  );
}
