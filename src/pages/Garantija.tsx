import { PageLayout } from "@/components/layout/PageLayout";
import { Shield } from "lucide-react";

export default function Garantija() {
  return (
    <PageLayout>
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-8">Garantija</h1>
          
          <div className="prose prose-lg max-w-none">
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">24 mėnesių garantija</h2>
              </div>
              <p className="text-muted-foreground">
                Visiems produktams taikoma 24 mėnesių gamintojo garantija nuo pirkimo datos.
              </p>
            </div>

            <h3>Ką apima garantija?</h3>
            <ul className="text-muted-foreground">
              <li>Gamybos defektai</li>
              <li>Trūkstamos detalės (sprendžiama per 5 d.d.)</li>
              <li>Pažeistos detalės pakuotėje</li>
            </ul>

            <h3>Ko neapima garantija?</h3>
            <ul className="text-muted-foreground">
              <li>Mechaniniai pažeidimai dėl netinkamo naudojimo</li>
              <li>Normalus nusidėvėjimas</li>
              <li>Pakeitimai ar modifikacijos</li>
            </ul>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
