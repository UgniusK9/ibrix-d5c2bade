import { Link } from "react-router-dom";
import { LucideIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  href: string;
  accentColorClass: string;
}

export function CategoryCard({ title, subtitle, icon: Icon, href, accentColorClass }: CategoryCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col bg-card rounded-xl overflow-hidden",
        "border border-border",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
        "hover:border-primary/30 dark:hover:border-primary/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
    >
      {/* Top accent bar */}
      <div className={cn("h-1 w-full", accentColorClass)} />

      {/* Card content */}
      <div className="flex items-center gap-3 p-4">
        {/* Icon container */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
            "bg-secondary/50 dark:bg-secondary/30",
            "transition-all duration-200",
            "group-hover:scale-110"
          )}
        >
          <Icon 
            className={cn(
              "h-5 w-5 transition-colors duration-200",
              "text-muted-foreground group-hover:text-primary"
            )} 
            strokeWidth={1.75} 
          />
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-sm text-foreground leading-tight truncate group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Arrow indicator */}
        <ChevronRight 
          className={cn(
            "flex-shrink-0 h-4 w-4 text-muted-foreground/50",
            "transition-all duration-200",
            "group-hover:text-primary group-hover:translate-x-0.5"
          )} 
        />
      </div>
    </Link>
  );
}
