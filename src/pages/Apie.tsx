import { Clock, Truck, Headphones, Puzzle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";

const expectations = [
  {
    icon: Clock,
    title: "Aiškus pre-order",
    description: "Visada žinosite, kada tikėtis savo produkto. Terminai nurodyti kiekvieno produkto puslapyje.",
  },
  {
    icon: Truck,
    title: "Nemokamas siuntimas į paštomatą",
    description: "Pristatome nemokamai į bet kurį paštomatą Lietuvoje – Omniva, LP Express ar DPD.",
  },
  {
    icon: Headphones,
    title: "Pagalba lietuviškai",
    description: "Mūsų komanda kalba lietuviškai ir pasiruošusi padėti bet kokiu klausimu.",
  },
  {
    icon: Puzzle,
    title: "Trūkstamos detalės sprendžiamos",
    description: "Jei jūsų rinkinyje trūksta detalės – išspręsime per 5 darbo dienas, nemokamai.",
  },
];

export default function Apie() {
  return (
    <PageLayout>
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-8">
              Apie ibrix
            </h1>

            {/* Story */}
            <div className="prose prose-lg max-w-none mb-16">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Ibrix – tai techninių konstruktorių parduotuvė, sukurta mechanikos fanams Lietuvoje. 
                Mūsų tikslas – atnešti sudėtingus, detalizuotus ir funkcionalius variklio modelius 
                tiems, kurie vertina inžinerinį grožį.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Lietuvoje tokių modelių pasiūla visada buvo ribota – dauguma entuziastų turėjo 
                užsisakyti iš užsienio, mokėti muitus ir laukti neaiškius terminus. 
                Mes nusprendėme tai pakeisti.
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Dirbame tiesiogiai su gamintojais, kad galėtume pasiūlyti konkurencingas kainas, 
                aiškius pristatymo terminus ir lietuvišką aptarnavimą. Kiekvienas produktas 
                atitinka mūsų kokybės standartus, o jei kas nors ne taip – sprendžiame greitai 
                ir be bereikalingų formalumų.
              </p>
            </div>

            {/* Expectations Card */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <h2 className="font-heading text-2xl font-bold mb-6">
                Ko tikėtis dirbant su ibrix
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {expectations.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-6">
                Turite klausimų? Susisiekite su mumis arba peržiūrėkite mūsų kolekciją.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link to="/varikliai">
                    Peržiūrėti variklius
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/kontaktai">
                    Susisiekti
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
