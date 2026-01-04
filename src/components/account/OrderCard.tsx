import { useState } from 'react';
import { 
  ChevronDown, Package, CreditCard, Truck, MapPin, Calendar, 
  ExternalLink, Clock, CheckCircle2, Copy, Box, AlertCircle,
  RotateCcw, Wallet, FileText, Download
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrackingMap } from '@/components/tracking/TrackingMap';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OrderPayment {
  id: string;
  type: 'deposit' | 'balance' | 'refund';
  amount_eur: number;
  status: 'pending' | 'succeeded' | 'failed';
  created_at: string;
  stripe_payment_intent_id?: string;
}

interface OrderShipment {
  id: string;
  status: 'pending' | 'packed' | 'shipped' | 'in_transit' | 'delivered';
  tracking_number: string | null;
  tracking_token: string;
  carrier_code: 'omniva' | 'lp_express' | 'dpd' | 'other' | null;
  shipped_at: string | null;
  delivered_at: string | null;
  packed_at: string | null;
}

interface ShipmentEvent {
  id: string;
  status_code: string;
  description: string;
  location_label: string | null;
  lat: number | null;
  lng: number | null;
  occurred_at: string;
}

interface OrderItem {
  id: string;
  title_snapshot: string;
  quantity: number;
  unit_price_eur: number;
  unit_deposit_eur: number;
  sku_snapshot?: string;
}

interface BalanceRequest {
  id: string;
  payment_url: string | null;
  message: string | null;
  sent_at: string;
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
    payment_plan?: 'deposit_only' | 'full_payment';
  };
  payments?: OrderPayment[];
  shipment?: OrderShipment;
  shipmentEvents?: ShipmentEvent[];
  items?: OrderItem[];
  balanceRequest?: BalanceRequest | null;
  onPayBalance?: () => void;
  onRequestRefund?: () => void;
  isLoading?: boolean;
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof Package }> = {
  'created': { label: 'Sukurtas', className: 'bg-muted text-muted-foreground', icon: AlertCircle },
  'deposit_paid': { label: 'Depozitas sumokėtas', className: 'bg-success/10 text-success border-success/30', icon: CreditCard },
  'awaiting_balance': { label: 'Laukia likučio', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: Clock },
  'balance_paid': { label: 'Pilnai apmokėtas', className: 'bg-success/10 text-success border-success/30', icon: CheckCircle2 },
  'packed': { label: 'Supakuotas', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Box },
  'shipped': { label: 'Išsiųstas', className: 'bg-primary/10 text-primary border-primary/30', icon: Truck },
  'delivered': { label: 'Pristatytas', className: 'bg-success/10 text-success border-success/30', icon: CheckCircle2 },
  'cancelled': { label: 'Atšauktas', className: 'bg-destructive/10 text-destructive border-destructive/30', icon: AlertCircle },
  'refunded': { label: 'Grąžintas', className: 'bg-muted text-muted-foreground', icon: RotateCcw },
};

const carrierNames: Record<string, string> = {
  'omniva': 'Omniva',
  'lp_express': 'LP EXPRESS',
  'dpd': 'DPD',
  'other': 'Kitas kurjeris',
};

const carrierTrackingUrls: Record<string, (trackingNumber: string) => string> = {
  'omniva': (tn) => `https://www.omniva.lt/verslo/siuntos_sekimas?barcode=${tn}`,
  'lp_express': (tn) => `https://www.lpexpress.lt/tracking?parcel_number=${tn}`,
  'dpd': (tn) => `https://www.dpd.lt/lt/sekti-siunta/${tn}`,
  'other': () => '#',
};

function formatDate(dateStr: string | null, includeTime = true): string {
  if (!dateStr) return '-';
  const options: Intl.DateTimeFormatOptions = includeTime 
    ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('lt-LT', options);
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Nukopijuota į iškarpinę');
}

// Progress steps for order status
const orderSteps = [
  { key: 'deposit_paid', label: 'Depozitas', icon: CreditCard },
  { key: 'balance_paid', label: 'Apmokėta', icon: CheckCircle2 },
  { key: 'packed', label: 'Supakuota', icon: Box },
  { key: 'shipped', label: 'Išsiųsta', icon: Truck },
  { key: 'delivered', label: 'Pristatyta', icon: MapPin },
];

const getStepIndex = (status: string): number => {
  const statusOrder = ['created', 'deposit_paid', 'awaiting_balance', 'balance_paid', 'packed', 'shipped', 'delivered'];
  const idx = statusOrder.indexOf(status);
  if (idx <= 1) return 0;
  if (idx === 2) return 0;
  if (idx === 3) return 1;
  if (idx === 4) return 2;
  if (idx === 5) return 3;
  if (idx === 6) return 4;
  return 0;
};

export function OrderCard({ 
  order, 
  payments, 
  shipment, 
  shipmentEvents, 
  items, 
  balanceRequest,
  onPayBalance,
  onRequestRefund,
  isLoading 
}: OrderCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = statusConfig[order.status] || statusConfig['created'];
  const StatusIcon = config.icon;

  const depositPayment = payments?.find(p => p.type === 'deposit' && p.status === 'succeeded');
  const balancePayment = payments?.find(p => p.type === 'balance' && p.status === 'succeeded');
  const totalPaid = (depositPayment?.amount_eur || 0) + (balancePayment?.amount_eur || 0);
  const currentStep = getStepIndex(order.status);
  const needsBalancePayment = order.status === 'awaiting_balance' || 
    (order.status === 'deposit_paid' && order.balance_total_eur > 0 && !balancePayment);

  // Get shipping address display
  const getShippingDisplay = () => {
    const addr = order.shipping_address_json;
    if (!addr) return null;
    
    if (addr.lockerName) {
      return { type: 'locker', name: addr.lockerName as string, address: addr.lockerAddress as string, city: addr.lockerCity as string };
    }
    if (addr.street) {
      return { type: 'courier', name: 'Kurjeris į namus', address: `${addr.street}, ${addr.city} ${addr.postalCode}` };
    }
    return null;
  };

  const shippingInfo = getShippingDisplay();

  // Calculate ETA for preorders
  const getEstimatedDelivery = () => {
    if (order.status === 'delivered') return 'Pristatyta';
    if (shipment?.status === 'shipped') return '1–3 darbo dienos';
    if (order.preorder_flag && order.preorder_eta_weeks_min) {
      return `${order.preorder_eta_weeks_min}–${order.preorder_eta_weeks_max || order.preorder_eta_weeks_min} savaitės`;
    }
    if (!order.preorder_flag) return '1–3 darbo dienos';
    return null;
  };

  // Get last event with coordinates for map
  const getLastEventWithLocation = () => {
    if (!shipmentEvents || shipmentEvents.length === 0) return null;
    const eventWithCoords = shipmentEvents.find(e => e.lat && e.lng);
    if (eventWithCoords) return eventWithCoords;
    return shipmentEvents[0]; // Return latest even without coords
  };

  const lastEvent = getLastEventWithLocation();

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-pulse">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-premium hover:shadow-premium-lg transition-shadow">
        {/* Header - always visible */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-5 md:p-6 text-left hover:bg-muted/30 transition-colors">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-lg">{order.order_number}</p>
                    {order.preorder_flag && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                        Pre-order
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.created_at, false)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn("gap-1.5", config.className)}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {config.label}
                </Badge>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )} />
              </div>
            </div>

            {/* Balance Payment CTA - Prominent when needed */}
            {needsBalancePayment && balanceRequest?.payment_url && (
              <div className="mb-4 p-4 bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 rounded-xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-accent">Laukiamas likučio apmokėjimas</p>
                      <p className="text-sm text-muted-foreground">
                        Suma: {formatPrice(order.balance_total_eur)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = balanceRequest.payment_url!;
                    }}
                  >
                    Apmokėti likutį
                  </Button>
                </div>
              </div>
            )}

            {/* Progress indicator */}
            {!['cancelled', 'refunded'].includes(order.status) && (
              <div className="mb-4">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
                  <div 
                    className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-300" 
                    style={{ width: `${(currentStep / (orderSteps.length - 1)) * 100}%` }}
                  />
                  {orderSteps.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={step.key} className="relative z-10 flex flex-col items-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                          isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                        )}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <span className={cn(
                          "text-xs mt-2 hidden sm:block",
                          isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm pt-2 border-t border-border/50">
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Iš viso</span>
                <p className="font-bold text-lg">{formatPrice(order.total_eur)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Sumokėta</span>
                <p className="font-bold text-lg text-success">
                  {formatPrice(totalPaid)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Liko mokėti</span>
                <p className={cn(
                  "font-bold text-lg",
                  order.balance_total_eur > 0 && !balancePayment ? "text-amber-600" : "text-success"
                )}>
                  {balancePayment || order.balance_total_eur === 0 
                    ? "0,00 €" 
                    : formatPrice(order.balance_total_eur)}
                </p>
              </div>
              {getEstimatedDelivery() && (
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">ETA</span>
                  <p className="font-semibold">{getEstimatedDelivery()}</p>
                </div>
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="border-t border-border p-5 md:p-6 space-y-6 bg-muted/10">
            {/* Payment Timeline */}
            <div className="space-y-4">
              <h4 className="font-heading font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Mokėjimų istorija
              </h4>
              <div className="space-y-3">
                {/* Deposit */}
                <div className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                  depositPayment ? "bg-success/5 border-success/20" : "bg-muted/50 border-border"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    depositPayment ? "bg-success text-success-foreground" : "bg-muted"
                  )}>
                    {depositPayment ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {order.payment_plan === 'full_payment' ? 'Pilnas mokėjimas' : 'Depozitas'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Mokėjimo būdas: Kortelė / Stripe
                        </p>
                      </div>
                      <span className="font-bold">{formatPrice(order.deposit_total_eur)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {depositPayment 
                        ? `Apmokėta ${formatDate(depositPayment.created_at)}` 
                        : 'Laukiama apmokėjimo'}
                    </p>
                  </div>
                </div>

                {/* Balance (only show if there's a balance to pay) */}
                {order.balance_total_eur > 0 && (
                  <div className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                    balancePayment ? "bg-success/5 border-success/20" : "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"
                  )}>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      balancePayment ? "bg-success text-success-foreground" : "bg-amber-100 dark:bg-amber-900/30"
                    )}>
                      {balancePayment 
                        ? <CheckCircle2 className="w-5 h-5" /> 
                        : <Clock className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Likutis</p>
                          {balancePayment && (
                            <p className="text-xs text-muted-foreground">
                              Mokėjimo būdas: Kortelė / Stripe
                            </p>
                          )}
                        </div>
                        <span className="font-bold">{formatPrice(order.balance_total_eur)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {balancePayment 
                          ? `Apmokėta ${formatDate(balancePayment.created_at)}` 
                          : 'Laukiama apmokėjimo'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping info */}
            {(shipment || shippingInfo) && (
              <div className="space-y-4">
                <h4 className="font-heading font-semibold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  Siuntimo informacija
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-card rounded-xl border border-border">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Kurjeris</span>
                    <p className="font-semibold mt-1">
                      {shipment?.carrier_code ? carrierNames[shipment.carrier_code] : (shippingInfo?.type === 'locker' ? 'Paštomatas' : 'Kurjeris')}
                    </p>
                  </div>
                  <div className="p-4 bg-card rounded-xl border border-border">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Siuntos kodas</span>
                    {shipment?.tracking_number ? (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono font-semibold">{shipment.tracking_number}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(shipment.tracking_number!);
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        {shipment.carrier_code && shipment.carrier_code !== 'other' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            asChild
                          >
                            <a 
                              href={carrierTrackingUrls[shipment.carrier_code](shipment.tracking_number)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-1">Dar nėra</p>
                    )}
                  </div>
                  {shippingInfo && (
                    <div className="p-4 bg-card rounded-xl border border-border sm:col-span-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Pristatymo adresas</span>
                      <p className="font-semibold mt-1">{shippingInfo.name}</p>
                      <p className="text-sm text-muted-foreground">{shippingInfo.address}</p>
                    </div>
                  )}
                  {shipment?.shipped_at && (
                    <div className="p-4 bg-card rounded-xl border border-border">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Išsiųsta</span>
                      <p className="font-semibold mt-1">{formatDate(shipment.shipped_at)}</p>
                    </div>
                  )}
                  {getEstimatedDelivery() && (
                    <div className="p-4 bg-card rounded-xl border border-border">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Numatomas pristatymas</span>
                      <p className="font-semibold mt-1">{getEstimatedDelivery()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            {items && items.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-heading font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Prekės
                </h4>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                      <div>
                        <p className="font-medium">{item.title_snapshot}</p>
                        <p className="text-sm text-muted-foreground">
                          Kiekis: {item.quantity} × {formatPrice(item.unit_price_eur)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatPrice(item.unit_price_eur * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipment Events Timeline */}
            {shipmentEvents && shipmentEvents.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-heading font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Siuntos kelionė
                </h4>
                <div className="space-y-3">
                  {shipmentEvents.slice(0, 5).map((event, idx) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2",
                        idx === 0 ? "bg-primary" : "bg-muted-foreground/30"
                      )} />
                      <div className="flex-1">
                        <p className={cn("font-medium text-sm", idx === 0 && "text-primary")}>
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {event.location_label && <span>{event.location_label}</span>}
                          <span>•</span>
                          <span>{formatDate(event.occurred_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {(lastEvent || shippingInfo) && (
              <TrackingMap
                location={lastEvent?.location_label || shippingInfo?.city || null}
                coordinates={lastEvent?.lat && lastEvent?.lng ? { lat: lastEvent.lat, lng: lastEvent.lng } : null}
                carrierName={shipment?.carrier_code ? carrierNames[shipment.carrier_code] : null}
                lastUpdate={lastEvent?.occurred_at || null}
              />
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              {needsBalancePayment && balanceRequest?.payment_url && (
                <Button 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  asChild
                >
                  <a href={balanceRequest.payment_url}>
                    <Wallet className="w-4 h-4 mr-2" />
                    Apmokėti likutį ({formatPrice(order.balance_total_eur)})
                  </a>
                </Button>
              )}
              {shipment?.tracking_number && shipment.carrier_code && shipment.carrier_code !== 'other' && (
                <Button variant="outline" asChild>
                  <a 
                    href={carrierTrackingUrls[shipment.carrier_code](shipment.tracking_number)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Sekti siuntą
                  </a>
                </Button>
              )}
              {/* Invoice Download */}
              {depositPayment && (
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke('generate-invoice', {
                        body: { orderId: order.id, action: 'html' }
                      });
                      if (error) throw error;
                      
                      // Open invoice HTML in new window for printing
                      const invoiceWindow = window.open('', '_blank');
                      if (invoiceWindow) {
                        invoiceWindow.document.write(data);
                        invoiceWindow.document.close();
                      }
                    } catch (e) {
                      console.error('Invoice error:', e);
                      toast.error('Nepavyko sugeneruoti sąskaitos');
                    }
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Sąskaita
                </Button>
              )}
              {['delivered', 'shipped'].includes(order.status) && onRequestRefund && (
                <Button variant="outline" onClick={onRequestRefund}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Grąžinti
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}