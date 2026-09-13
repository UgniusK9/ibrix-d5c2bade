import { Truck, Shield, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const badges = [
  { icon: Truck, title: "trustBadges.freeShipping", description: "trustBadges.freeShippingDesc" },
  { icon: Shield, title: "trustBadges.clearPreOrder", description: "trustBadges.clearPreOrderDesc" },
  { icon: Headphones, title: "trustBadges.missingParts", description: "trustBadges.missingPartsDesc" },
];

export function TrustBadges() {
  const { t } = useTranslation();
  return (
    <section className="py-5 border-b border-border bg-card">
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
              <badge.icon className="w-5 h-5 text-accent flex-shrink-0" strokeWidth={1.75} />
              <div className="min-w-0">
                <span className="font-medium text-foreground">{t(badge.title)}</span>
                <span className="text-muted-foreground hidden sm:inline"> – {t(badge.description)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
