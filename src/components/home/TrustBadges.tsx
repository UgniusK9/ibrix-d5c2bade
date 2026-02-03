import { Truck, Shield, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

const badges = [
  {
    icon: Truck,
    title: "Nemokamas pristatymas",
    description: "Į paštomatą – visada nemokamai",
  },
  {
    icon: Shield,
    title: "Aiškus pre-order",
    description: "Atšaukti galima iki išsiuntimo",
  },
  {
    icon: Headphones,
    title: "Trūkstamos detalės",
    description: "Nemokamai išsiunčiame",
  },
];

export function TrustBadges() {
  return (
    <section className="py-6 md:py-8 bg-secondary/30 dark:bg-secondary/10">
      <div className="container">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 lg:gap-12">
          {badges.map((badge, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 px-4 py-2",
                "text-sm"
              )}
            >
              <badge.icon className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-foreground">{badge.title}</span>
                <span className="text-muted-foreground hidden sm:inline"> – {badge.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
