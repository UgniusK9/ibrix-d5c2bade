import { PageLayout } from "@/components/layout/PageLayout";
import { Puzzle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TrukstamosDetales() {
  return (
    <PageLayout>
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-8">Trūkstamos detalės</h1>
          
          <div className="prose prose-lg max-w-none">
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Puzzle className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">Išsprendžiame per 5 darbo dienas</h2>
              </div>
              <p className="text-muted-foreground">
                Jei jūsų rinkinyje trūksta detalės – išsiųsime ją nemokamai per 5 darbo dienas.
              </p>
            </div>

            <h3>Ką daryti, jei trūksta detalės?</h3>
            <ol className="text-muted-foreground">
              <li>Susisiekite su mumis per kontaktų formą arba el. paštu</li>
              <li>Nurodykite produkto pavadinimą ir trūkstamos detalės numerį (iš instrukcijos)</li>
              <li>Jei įmanoma, pridėkite nuotrauką</li>
              <li>Išsiųsime trūkstamą detalę per 5 darbo dienas</li>
            </ol>

            <div className="mt-8">
              <Button asChild>
                <Link to="/kontaktai">Pranešti apie trūkstamą detalę</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
