import { useState } from 'react';
import { ChevronDown, Package, CreditCard, Truck, MapPin, Calendar, ExternalLink, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface OrderPayment {
  id: string;
  type: 'deposit' | 'balance' | 'refund';
  amount_eur: number;
  status: 'pending' | 'succeeded' | 'failed';
  created_at: string;
}

interface OrderShipment {
  id: string;
  status: 'pending' | 'packed' | 'shipped' | 'in_transit' | 'delivered';
  tracking_number: string | null;
  tracking_token: string;
  carrier_code: 'omniva' | 'lp_express' | 'dpd' | 'other' | null;
  shipped_at: string | null;
  delivered_at: string | null;
  last_location?: string;
  last_location_lat?: number;
  last_location_lng?: number;
}

interface OrderItem {
  id: string;
  title_snapshot: string;
  quantity: number;
  unit_price_eur: number;
  unit_deposit_eur: number;
}

interface OrderCardProps {
  order: {
    id: string;
    order_number: string;
    status: string;
    total_eur: number;
    deposit_total_eur: number;
    balance_total_eur: number;
    created_at: string;
    paid_at: string | null;
    balance_paid_at: string | null;
    shipping_address_json: Record<string, unknown> | null;
    preorder_flag: boolean;
    preorder_eta_weeks_min: number | null;
    preorder_eta_weeks_max: number | null;
  };
  payments?: OrderPayment[];
  shipment?: OrderShipment;
  items?: OrderItem[];
  onPayBalance?: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  'created': { label: 'Sukurtas', className: 'bg-muted text-muted-foreground' },
  'deposit_paid': { label: 'Depozitas sumokėtas', className: 'bg-green-500/10 text-green-600' },
  'awaiting_balance': { label: 'Laukia likučio', className: 'bg-yellow-500/10 text-yellow-600' },
  'balance_paid': { label: 'Pilnai apmokėtas', className: 'bg-green-500/10 text-green-600' },
  'packed': { label: 'Supakuotas', className: 'bg-blue-500/10 text-blue-600' },
  'shipped': { label: 'Išsiųstas', className: 'bg-primary/10 text-primary' },
  'delivered': { label: 'Pristatytas', className: 'bg-green-500/10 text-green-600' },
  'cancelled': { label: 'Atšauktas', className: 'bg-destructive/10 text-destructive' },
  'refunded': { label: 'Grąžintas', className: 'bg-muted text-muted-foreground' },
};

const carrierNames: Record<string, string> = {
  'omniva': 'Omniva',
  'lp_express': 'LP EXPRESS',
  'dpd': 'DPD',
  'other': 'Kitas kurjeris',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function OrderCard({ order, payments, shipment, items, onPayBalance }: OrderCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = statusConfig[order.status] || statusConfig['created'];

  const depositPayment = payments?.find(p => p.type === 'deposit' && p.status === 'succeeded');
  const balancePayment = payments?.find(p => p.type === 'balance' && p.status === 'succeeded');

  // Get shipping address display
  const getShippingDisplay = () => {
    const addr = order.shipping_address_json;
    if (!addr) return null;
    
    if (addr.lockerName) {
      return `${addr.lockerName}, ${addr.lockerAddress}`;
    }
    if (addr.street) {
      return `${addr.street}, ${addr.city} ${addr.postalCode}`;
    }
    return null;
  };

  // Calculate ETA for preorders
  const getEstimatedDelivery = () => {
    if (order.status === 'delivered') return 'Pristatyta';
    if (order.preorder_flag && order.preorder_eta_weeks_min) {
      return `${order.preorder_eta_weeks_min}–${order.preorder_eta_weeks_max || order.preorder_eta_weeks_min} sav.`;
    }
    if (order.status === 'shipped') return '1–3 d.d.';
    return null;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header - always visible */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-mono font-semibold">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('lt-LT')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={config.className}>{config.label}</Badge>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )} />
              </div>
            </div>

            {/* Quick summary */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Iš viso:</span>
                <p className="font-semibold">{formatPrice(order.total_eur)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sumokėta:</span>
                <p className="font-semibold text-green-600">
                  {formatPrice(depositPayment ? order.deposit_total_eur : 0)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Likutis:</span>
                <p className={cn(
                  "font-semibold",
                  balancePayment ? "text-green-600" : "text-yellow-600"
                )}>
                  {balancePayment ? "Apmokėtas" : formatPrice(order.balance_total_eur)}
                </p>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="border-t border-border p-4 space-y-6">
            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Mokėjimų istorija
              </h4>
              <div className="space-y-2 pl-6 border-l-2 border-border">
                {/* Deposit */}
                <div className="relative">
                  <div className={cn(
                    "absolute -left-[25px] w-4 h-4 rounded-full border-2",
                    depositPayment ? "bg-green-500 border-green-500" : "bg-muted border-muted-foreground"
                  )}>
                    {depositPayment && <CheckCircle2 className="w-3 h-3 text-white absolute top-0.5 left-0.5" />}
                  </div>
                  <div className="ml-2">
                    <p className="font-medium text-sm">Depozitas – {formatPrice(order.deposit_total_eur)}</p>
                    <p className="text-xs text-muted-foreground">
                      {depositPayment ? formatDate(depositPayment.created_at) : 'Laukiama'}
                    </p>
                  </div>
                </div>
                {/* Balance */}
                {order.balance_total_eur > 0 && (
                  <div className="relative">
                    <div className={cn(
                      "absolute -left-[25px] w-4 h-4 rounded-full border-2",
                      balancePayment ? "bg-green-500 border-green-500" : "bg-muted border-muted-foreground"
                    )}>
                      {balancePayment && <CheckCircle2 className="w-3 h-3 text-white absolute top-0.5 left-0.5" />}
                    </div>
                    <div className="ml-2">
                      <p className="font-medium text-sm">Likutis – {formatPrice(order.balance_total_eur)}</p>
                      <p className="text-xs text-muted-foreground">
                        {balancePayment ? formatDate(balancePayment.created_at) : 'Laukiama apmokėjimo'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping info */}
            {shipment && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Siuntimo informacija
                </h4>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Kurjeris:</span>
                    <p className="font-medium">{shipment.carrier_code ? carrierNames[shipment.carrier_code] : '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Siuntos kodas:</span>
                    <p className="font-medium font-mono">{shipment.tracking_number || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Išsiųsta:</span>
                    <p className="font-medium">{formatDate(shipment.shipped_at)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Numatomas pristatymas:</span>
                    <p className="font-medium">{getEstimatedDelivery() || '-'}</p>
                  </div>
                </div>

                {/* Tracking link */}
                {shipment.tracking_token && (
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <a href={`/siuntos-sekimas?token=${shipment.tracking_token}`} target="_blank">
                      <MapPin className="w-4 h-4 mr-2" />
                      Sekti siuntą
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Shipping address */}
            {getShippingDisplay() && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  Pristatymo adresas
                </h4>
                <p className="text-sm text-muted-foreground pl-6">{getShippingDisplay()}</p>
              </div>
            )}

            {/* Order items */}
            {items && items.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Prekės
                </h4>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                      <span>{item.title_snapshot} × {item.quantity}</span>
                      <span className="font-medium">{formatPrice(item.unit_price_eur * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pay balance button */}
            {order.status === 'awaiting_balance' && onPayBalance && (
              <Button onClick={onPayBalance} className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Apmokėti likutį ({formatPrice(order.balance_total_eur)})
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
