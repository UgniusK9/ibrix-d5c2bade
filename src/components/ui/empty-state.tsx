import { LucideIcon, Package, ShoppingCart, Heart, Search, FileQuestion, Puzzle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: "default" | "cart" | "wishlist" | "search" | "orders" | "builders";
  className?: string;
}

const VARIANT_ICONS: Record<string, LucideIcon> = {
  default: FileQuestion,
  cart: ShoppingCart,
  wishlist: Heart,
  search: Search,
  orders: Package,
  builders: Puzzle,
};

const VARIANT_COLORS: Record<string, string> = {
  default: "text-primary/20",
  cart: "text-accent/30",
  wishlist: "text-red-500/20",
  search: "text-primary/20",
  orders: "text-primary/20",
  builders: "text-accent/30",
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  variant = "default",
  className,
}: EmptyStateProps) {
  const Icon = icon || VARIANT_ICONS[variant];
  const iconColor = VARIANT_COLORS[variant];

  return (
    <div className={cn("empty-state", className)}>
      {/* Decorative circles */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-primary/5 animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-accent/10" />
        </div>
        <div className="relative z-10 w-20 h-20 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-soft">
          <Icon className={cn("w-10 h-10", iconColor)} strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>

      {(actionLabel && actionHref) && (
        <Button asChild variant="default" size="lg">
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      )}

      {(actionLabel && onAction && !actionHref) && (
        <Button variant="default" size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
