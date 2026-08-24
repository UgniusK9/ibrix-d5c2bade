import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { RotateCcw, PackageCheck, Ban, Wrench, Wallet, ShieldCheck } from "lucide-react";
import { COMPANY } from "@/config/company";

export default function Grazinimai() {
  const mailto = `mailto:${COMPANY.email}`;

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-2">Grąžinimai</h1>
          <p className="text-sm text-muted-foreground mb-10">Atnaujinta {COMPANY.updated}</p>

          <div className="space-y-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <RotateCcw className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">14 dienų grąžinimo teisė</h2>
              </div>
              <p className="text-muted-foreground m-0">
                Prekę galite grąžinti per 14 (keturiolika) dienų nuo jos gavimo nenurodydami
                priežasties. Terminas skaičiuojamas nuo dienos, kurią atsiėmėte siuntą.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <PackageCheck className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">Kaip grąžinti prekę</h2>
              </div>
              <ol className="text-muted-foreground m-0 space-y-2 list-decimal ml-4">
                <li>
                  Parašykite el. laišką adresu <a href={mailto} className="text-primary underline">{COMPANY.email}</a>{" "}
                  ir nurodykite užsakymo numerį bei grąžinamą prekę.
                </li>
                <li>Gausite grąžinimo instrukcijas ir adresą, kuriuo siųsti siuntą.</li>
                <li>Supakuokite prekę į originalią pakuotę kartu su visomis detalėmis.</li>
                <li>Išsiųskite siuntą ir išsaugokite siuntimo patvirtinimą.</li>
              </ol>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">
                  Kokybiškų prekių grąžinimo sąlygos
                </h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2 list-disc ml-4">
                <li>Prekė nenaudota ir nesugadinta.</li>
                <li>Prekė nepraradusi prekinės išvaizdos.</li>
                <li>Išsaugota originali pakuotė ir visos rinkinio detalės.</li>
                <li>Pridėtas užsakymo numeris arba pirkimo dokumentas.</li>
              </ul>
              <p className="text-muted-foreground mt-4 mb-0">
                <strong className="text-foreground">Svarbu:</strong> surinktas konstruktorius laikomas
                praradusiu prekinę išvaizdą, todėl tokia prekė negali būti grąžinta pagal šį punktą.
                Tai netaikoma nekokybiškoms prekėms.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Ban className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">
                  Prekės, kurių grąžinti negalima
                </h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2 list-disc ml-4">
                <li>Prekės, pagamintos pagal individualų Pirkėjo užsakymą.</li>
                <li>Dovanų kuponai, jeigu jie jau buvo panaudoti.</li>
                <li>Prekės, kurių pakuotė buvo pažeista Pirkėjo veiksmais.</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wrench className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">Netinkamos kokybės prekės</h2>
              </div>
              <p className="text-muted-foreground mb-3">
                Gavus brokuotą ar sugadintą prekę, susisiekite per 14 dienų ir pridėkite nuotraukas.
                Tokiu atveju prekę pakeičiame, taisome arba grąžiname pinigus, o siuntimo išlaidas
                apmokame mes.
              </p>
              <p className="text-muted-foreground m-0">
                Jeigu tiesiog <strong className="text-foreground">trūksta detalės</strong>, grąžinti
                viso rinkinio nereikia – atsiųsime ją nemokamai. Užpildykite formą skiltyje{" "}
                <a href="/trukstamos-detales" className="text-primary underline">
                  Trūkstamos detalės
                </a>
                .
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">Pinigų grąžinimas</h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2 list-disc ml-4">
                <li>
                  Pinigai grąžinami per 14 dienų nuo prekės grąžinimo, tuo pačiu būdu, kuriuo buvo
                  atsiskaityta.
                </li>
                <li>
                  Grąžinant kokybišką prekę, siuntimo išlaidas apmoka Pirkėjas. Grąžinant nekokybišką
                  prekę – Pardavėjas.
                </li>
                <li>
                  Atšaukus išankstinį užsakymą iki išsiuntimo, sumokėtas avansas grąžinamas visas.
                </li>
              </ul>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-10">
            Išsamios sąlygos nurodytos{" "}
            <a href="/taisykles" className="text-primary underline">
              Pirkimo taisyklėse
            </a>
            . Nepavykus susitarti, galite kreiptis į {COMPANY.vvtat} (
            <a href={COMPANY.vvtatUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              vvtat.lt
            </a>
            ).
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
