import { Truck, Shield, Headphones } from "lucide-react";

const badges = [
  {
    icon: Truck,
    title: "Nemokamas pristatymas",
    description: "Į paštomatą visoje Lietuvoje",
  },
  {
    icon: Shield,
    title: "Pre-order be rizikos",
    description: "Aiškus terminas, atšaukimas bet kada",
  },
  {
    icon: Headphones,
    title: "Pagalba LT",
    description: "Trūkstamos detalės sprendžiamos",
  },
];

export function TrustBadges() {
  return (
    <section className="py-12 md:py-16 bg-card border-y border-border">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {badges.map((badge, index) => (
            <div 
              key={index}
              className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <badge.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-base mb-1">
                  {badge.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
