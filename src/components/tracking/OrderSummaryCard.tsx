import { Package, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface OrderItem {
  title: string;
  quantity: number;
  unit_price_cents?: number;
}

interface OrderSummaryCardProps {
  items: OrderItem[];
  trackingNumber?: string | null;
  subtotalCents?: number;
  shippingCents?: number;
  totalCents?: number;
}

export function OrderSummaryCard({
  items,
  trackingNumber,
  subtotalCents,
  shippingCents,
  totalCents,
}: OrderSummaryCardProps) {
  const [copied, setCopied] = useState(false);

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const copyTrackingNumber = async () => {
    if (!trackingNumber) return;
    
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      toast.success('Sekimo numeris nukopijuotas');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Nepavyko nukopijuoti');
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-premium">
      <h3 className="font-heading text-lg font-semibold mb-4">Užsakymo turinys</h3>
      
      {/* Items list */}
      <div className="space-y-3 mb-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">Kiekis: {item.quantity}</p>
            </div>
            {item.unit_price_cents && (
              <span className="text-sm font-medium">
                {formatPrice(item.unit_price_cents * item.quantity)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tracking number */}
      {trackingNumber && (
        <div className="border-t border-border pt-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Sekimo numeris</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
              {trackingNumber}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={copyTrackingNumber}
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Totals */}
      {(subtotalCents !== undefined || totalCents !== undefined) && (
        <div className="border-t border-border pt-4 space-y-2">
          {subtotalCents !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tarpinė suma</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
          )}
          {shippingCents !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pristatymas</span>
              <span>{shippingCents === 0 ? 'Nemokamas' : formatPrice(shippingCents)}</span>
            </div>
          )}
          {totalCents !== undefined && (
            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
              <span>Viso</span>
              <span>{formatPrice(totalCents)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
