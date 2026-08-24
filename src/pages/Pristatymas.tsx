import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { Truck, Clock, MapPin, PackageSearch, ShieldAlert } from "lucide-react";
import { COMPANY } from "@/config/company";

export default function Pristatymas() {
  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-2">Pristatymas</h1>
          <p className="text-sm text-muted-foreground mb-10">Atnaujinta {COMPANY.updated}</p>

          <div className="space-y-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">Pristatymo kaina</h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2">
                <li>
                  <strong className="text-foreground">Į paštomatą – nemokamai.</strong> Omniva, LP
                  Express arba DPD paštomatai visoje Lietuvoje.
                </li>
                <li>
                  <strong className="text-foreground">Kurjeriu į namus – 4,99 €.</strong> Pristatoma
                  nurodytu adresu darbo dienomis.
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">Pristatymo terminai</h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2">
                <li>
                  <strong className="text-foreground">Sandėlyje esančios prekės:</strong> 1–2 darbo
                  dienos nuo apmokėjimo.
                </li>
                <li>
                  <strong className="text-foreground">
                    Išankstinio užsakymo (pre-order) prekės:
                  </strong>{" "}
                  terminas nurodomas prie kiekvienos prekės, dažniausiai 8–10 savaičių.
                </li>
              </ul>
              <p className="text-muted-foreground mt-4 mb-0">
                Terminai yra orientaciniai ir priklauso nuo kurjerių tarnybos bei gamintojo. Terminui
                reikšmingai pailgėjus informuojame el. paštu, o išankstinį užsakymą galite atšaukti
                ir atgauti sumokėtą avansą.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">Pristatymo būdai</h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2">
                <li>Omniva paštomatai</li>
                <li>LP Express paštomatai</li>
                <li>DPD paštomatai</li>
                <li>Kurjeris nurodytu adresu</li>
              </ul>
              <p className="text-muted-foreground mt-4 mb-0">
                Šiuo metu pristatome tik Lietuvos Respublikos teritorijoje.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <PackageSearch className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">Siuntos sekimas</h2>
              </div>
              <p className="text-muted-foreground m-0">
                Išsiuntus užsakymą el. paštu gausite sekimo numerį. Siuntos būseną taip pat matysite
                skiltyje{" "}
                <a href="/siuntos-sekimas" className="text-primary underline">
                  Siuntos sekimas
                </a>{" "}
                arba prisijungę prie paskyros.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">Siuntos priėmimas</h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2">
                <li>
                  Prekės atsitiktinio žuvimo ar sugedimo rizika pereina Pirkėjui nuo prekės atsiėmimo
                  momento.
                </li>
                <li>
                  Pastebėjus pažeistą pakuotę, tai būtina pažymėti siuntos perdavimo dokumente arba
                  nedelsiant pranešti mums.
                </li>
                <li>
                  Nurodykite tikslų adresą – dėl neteisingų duomenų atsiradusias papildomas siuntimo
                  išlaidas apmoka Pirkėjas.
                </li>
              </ul>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-10">
            Išsamios sąlygos nurodytos{" "}
            <a href="/taisykles" className="text-primary underline">
              Pirkimo taisyklėse
            </a>
            .
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
