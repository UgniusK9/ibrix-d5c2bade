import { Link } from "react-router-dom";
import { Truck, RotateCcw, Shield, Puzzle, Clock, Phone, ArrowRight } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";

const helpCards = [
  {
    icon: Truck,
    title: "Pristatymas",
    description: "Informacija apie pristatymo būdus, terminus ir kainas",
    href: "/pristatymas",
  },
  {
    icon: RotateCcw,
    title: "Grąžinimai",
    description: "Kaip grąžinti produktą ir atgauti pinigus",
    href: "/grazinimai",
  },
  {
    icon: Shield,
    title: "Garantija",
    description: "Garantijos sąlygos ir aptarnavimas",
    href: "/garantija",
  },
  {
    icon: Puzzle,
    title: "Trūkstamos detalės",
    description: "Ką daryti, jei trūksta detalių rinkinyje",
    href: "/trukstamos-detales",
  },
  {
    icon: Clock,
    title: "Pre-order",
    description: "Kaip veikia išankstinio užsakymo sistema",
    href: "/pre-order",
  },
  {
    icon: Phone,
    title: "Kontaktai",
    description: "Susisiekite su mumis tiesiogiai",
    href: "/kontaktai",
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
            <p className="text-lg text-muted-foreground">
              Kaip galime padėti? Pasirinkite temą arba susisiekite su mumis tiesiogiai.
            </p>
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
                  Skaityti daugiau
                  <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>

          {/* Quick Contact */}
          <div className="max-w-xl mx-auto mt-16 text-center">
            <p className="text-muted-foreground mb-4">
              Neradote atsakymo? Rašykite mums tiesiogiai:
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
    </PageLayout>
  );
}
