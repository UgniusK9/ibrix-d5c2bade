import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import { RotateCcw } from "lucide-react";

export default function Grazinimai() {
  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-8">Grąžinimai</h1>
          
          <div className="prose prose-lg max-w-none">
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <RotateCcw className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">14 dienų grąžinimo teisė</h2>
              </div>
              <p className="text-muted-foreground">
                Turite 14 dienų nuo produkto gavimo grąžinti prekę be jokių paaiškinimų.
              </p>
            </div>

            <h3>Grąžinimo sąlygos</h3>
            <ul className="text-muted-foreground">
              <li>Produktas turi būti originalioje pakuotėje</li>
              <li>Produktas neturi būti naudotas ar surinktas</li>
              <li>Turi būti pateikta pirkimo kvitas arba užsakymo numeris</li>
            </ul>

            <h3>Kaip grąžinti?</h3>
            <ol className="text-muted-foreground">
              <li>Susisiekite su mumis per kontaktų formą arba el. paštu support@ibrix.lt</li>
              <li>Nurodykite užsakymo numerį ir grąžinimo priežastį</li>
              <li>Atsiųsime grąžinimo etiketę</li>
              <li>Pinigai bus grąžinti per 5–7 darbo dienas</li>
            </ol>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
