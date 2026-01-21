import { Truck, Shield, Headphones } from "lucide-react";

const badges = [
  {
    icon: Truck,
    title: "Nemokamas pristatymas",
    description: "Į paštomatą Lietuvoje – visada nemokamai",
    iconColor: "text-sky-500 dark:text-sky-400",
    iconBg: "bg-sky-100 dark:bg-sky-500/20",
  },
  {
    icon: Shield,
    title: "Aiškus pre-order",
    description: "Atšaukti galima iki išsiuntimo",
    iconColor: "text-amber-500 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-500/20",
  },
  {
    icon: Headphones,
    title: "Trūkstamos detalės",
    description: "Nemokamai išsiunčiame trūkstamą dalį",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
  },
];

export function TrustBadges() {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-6 md:p-8 rounded-2xl bg-card border border-border transition-transform duration-200 hover:-translate-y-1"
            >
              <div className={`w-14 h-14 ${badge.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                <badge.icon className={`h-7 w-7 ${badge.iconColor}`} strokeWidth={2} />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-2">
                {badge.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
