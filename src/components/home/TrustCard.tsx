import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accentColor: "sky" | "amber" | "emerald";
}

const accentStyles = {
  sky: {
    iconBg: "bg-sky-50 dark:bg-sky-500/10",
    iconColor: "text-sky-600 dark:text-sky-400",
    borderHover: "group-hover:border-sky-200 dark:group-hover:border-sky-500/30",
  },
  amber: {
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderHover: "group-hover:border-amber-200 dark:group-hover:border-amber-500/30",
  },
  emerald: {
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderHover: "group-hover:border-emerald-200 dark:group-hover:border-emerald-500/30",
  },
};

export function TrustCard({ icon: Icon, title, description, accentColor }: TrustCardProps) {
  const styles = accentStyles[accentColor];

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 p-5 rounded-xl",
        "bg-card border border-border",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
        styles.borderHover
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          "flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center",
          "transition-transform duration-200 group-hover:scale-105",
          styles.iconBg
        )}
      >
        <Icon className={cn("h-5 w-5", styles.iconColor)} strokeWidth={2} />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-heading font-semibold text-sm text-foreground leading-tight mb-1">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
