import { Link } from "react-router-dom";
import { Truck, RotateCcw, Shield, Puzzle, Clock, Phone, ArrowRight } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { FAQSection } from "@/components/home/FAQSection";

const helpCards = [
  {
    icon: Truck,
    title: "Pristatymas",
    description: "Kiek kainuoja, kiek trunka, paštomatai/kurjeris, siuntos sekimas.",
    href: "/pristatymas",
    cta: "Pristatymo sąlygos",
  },
  {
    icon: RotateCcw,
    title: "Grąžinimai",
    description: "14 dienų taisyklė, sąlygos, kaip pateikti grąžinimą.",
    href: "/grazinimai",
    cta: "Kaip grąžinti",
  },
  {
    icon: Shield,
    title: "Garantija",
    description: "Kas laikoma garantiniu, kaip sprendžiame problemas.",
    href: "/garantija",
    cta: "Garantijos sąlygos",
  },
  {
    icon: Puzzle,
    title: "Trūkstamos detalės",
    description: "Ką daryti, jei trūksta detalės, kiek trunka, ko reikia iš jūsų.",
    href: "/trukstamos-detales",
    cta: "Trūkstamų detalių sprendimas",
  },
  {
    icon: Clock,
    title: "Pre-order",
    description: "Kaip veikia rezervacija, terminai, atšaukimas, statusai.",
    href: "/pre-order",
    cta: "Kaip veikia pre-order",
  },
  {
    icon: Phone,
    title: "Kontaktai",
    description: "Parašykite arba paskambinkite. Atsakome darbo valandomis.",
    href: "/kontaktai",
    cta: "Susisiekti",
  },
];

export default function Pagalba() {
  return (
    <PageLayout>
      <section className="py-16 md:py-24">
        <div className="container">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              Pagalba
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Pasirinkite temą arba parašykite mums – atsakome lietuviškai.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link to="/kontaktai">Parašyti mums</Link>
              </Button>
              <Button asChild variant="outline">
                <a href="#faq">Peržiūrėti D.U.K.</a>
              </Button>
            </div>
          </div>

          {/* Help Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {helpCards.map((card) => (
              <Link
                key={card.href}
                to={card.href}
                className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <card.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {card.description}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-primary">
                  {card.cta}
                  <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>

          {/* Quick Contact */}
          <div className="max-w-xl mx-auto mt-16 text-center">
            <p className="text-muted-foreground mb-2">
              Neradote atsakymo? Rašykite mums tiesiogiai:
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Atsakome darbo dienomis per 24 val.
            </p>
            <a 
              href="mailto:support@ibrix.lt" 
              className="text-lg font-medium text-primary hover:text-primary/80 transition-colors"
            >
              support@ibrix.lt
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <div id="faq">
        <FAQSection />
      </div>
    </PageLayout>
  );
}
