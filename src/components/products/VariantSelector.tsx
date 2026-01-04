import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { type ProductVariant, groupVariantsByType, getOptionTypeLabel } from '@/hooks/useProductVariants';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariants: Record<string, string>;
  onVariantChange: (type: string, variantId: string) => void;
  className?: string;
}

export function VariantSelector({ 
  variants, 
  selectedVariants, 
  onVariantChange,
  className 
}: VariantSelectorProps) {
  const groupedVariants = groupVariantsByType(variants);
  
  if (variants.length === 0) return null;
  
  return (
    <div className={cn("space-y-4", className)}>
      {Object.entries(groupedVariants).map(([type, typeVariants]) => (
        <div key={type}>
          <Label className="text-sm font-medium mb-2 block">
            {getOptionTypeLabel(type)}
          </Label>
          <RadioGroup
            value={selectedVariants[type] || ''}
            onValueChange={(value) => onVariantChange(type, value)}
            className="flex flex-wrap gap-2"
          >
            {typeVariants.map((variant) => (
              <div key={variant.id}>
                <RadioGroupItem
                  value={variant.id}
                  id={`variant-${variant.id}`}
                  className="peer sr-only"
                />
                <label
                  htmlFor={`variant-${variant.id}`}
                  className={cn(
                    "flex items-center justify-center px-4 py-2 rounded-lg border cursor-pointer transition-all",
                    "text-sm font-medium",
                    selectedVariants[type] === variant.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50",
                    variant.inventory_qty === 0 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {variant.option_value}
                  {variant.price_adjustment_eur !== 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({variant.price_adjustment_eur > 0 ? '+' : ''}{variant.price_adjustment_eur}€)
                    </span>
                  )}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
    </div>
  );
}
