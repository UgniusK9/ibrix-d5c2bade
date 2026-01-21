import { Truck, Shield, Headphones } from "lucide-react";
import { TrustCard } from "./TrustCard";

const badges = [
  {
    icon: Truck,
    title: "Nemokamas pristatymas",
    description: "Į paštomatą Lietuvoje – visada nemokamai",
    accentColor: "sky" as const,
  },
  {
    icon: Shield,
    title: "Aiškus pre-order",
    description: "Atšaukti galima iki išsiuntimo",
    accentColor: "amber" as const,
  },
  {
    icon: Headphones,
    title: "Trūkstamos detalės",
    description: "Nemokamai išsiunčiame trūkstamą dalį",
    accentColor: "emerald" as const,
  },
];

export function TrustBadges() {
  return (
    <section className="py-8 md:py-10 bg-secondary/30 dark:bg-secondary/10">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {badges.map((badge, index) => (
            <TrustCard
              key={index}
              icon={badge.icon}
              title={badge.title}
              description={badge.description}
              accentColor={badge.accentColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
