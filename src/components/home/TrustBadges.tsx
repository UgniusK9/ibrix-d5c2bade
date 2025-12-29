import { Truck, Shield, Headphones } from "lucide-react";

const badges = [
  {
    icon: Truck,
    title: "Nemokamas pristatymas į paštomatą (LT)",
    description: "Į paštomatą Lietuvoje – visada nemokamai. Kurjeris – pagal poreikį.",
  },
  {
    icon: Shield,
    title: "Aiškus pre-order",
    description: "Terminas aiškiai nurodytas prie kiekvieno modelio. Atšaukti galima iki išsiuntimo.",
  },
  {
    icon: Headphones,
    title: "Pagalba lietuviškai + trūkstamos detalės",
    description: "Jei trūksta detalės – parašote, ir nemokamai išsiunčiame trūkstamą dalį.",
  },
];

export function TrustBadges() {
  return (
    <section className="py-12 md:py-16 bg-card border-y border-border">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {badges.map((badge, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-2xl border border-border hover:border-primary/20 hover:shadow-premium transition-all duration-300 bg-background"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <badge.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-semibold text-base mb-2">
                {badge.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
