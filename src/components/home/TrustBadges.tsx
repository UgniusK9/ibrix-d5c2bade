import { Truck, RotateCcw, Shield, Headphones } from "lucide-react";

const badges = [
  {
    icon: Truck,
    title: "Nemokamas pristatymas",
    description: "Į paštomatą Lietuvoje – visada nemokamai.",
  },
  {
    icon: Shield,
    title: "Sąžiningas pre-order",
    description: "Aiškus terminas. Atšaukimas bet kada iki išsiuntimo.",
  },
  {
    icon: Headphones,
    title: "Pagalba LT + detalės",
    description: "Lietuviška pagalba ir trūkstamų detalių sprendimas.",
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
