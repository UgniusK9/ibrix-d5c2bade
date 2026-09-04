import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Package, CheckCircle2, Truck, MapPin, AlertCircle, Box, CreditCard, Clock, DollarSign, Bug } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TrackingMap } from "@/components/tracking/TrackingMap";
import { useAuth } from "@/contexts/AuthContext";

interface ShipmentEvent {
  id: string;
  status_code: string;
  description: string;
  location: string | null;
  occurred_at: string;
  source: 'internal' | 'carrier';
  lat?: number;
  lng?: number;
}

interface OrderItem {
  title: string;
  quantity: number;
  unit_price_eur: number;
  unit_deposit_eur: number;
}

interface PaymentInfo {
  type: 'deposit' | 'balance' | 'refund';
  status: 'pending' | 'succeeded' | 'failed';
  amount_eur: number;
  created_at: string;
}

interface ShipmentData {
  order_number: string;
  order_status: string;
  shipment_status: string;
  carrier_code: string | null;
  tracking_number: string | null;
  created_at: string;
  deposit_eur: number;
  balance_eur: number;
  total_eur: number;
  deposit_paid_at: string | null;
  balance_paid_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  last_update: string;
  current_location: string | null;
  coordinates: { lat: number; lng: number } | null;
  preorder_flag: boolean;
  eta_weeks_min: number | null;
  eta_weeks_max: number | null;
  events: ShipmentEvent[];
  items: OrderItem[];
  payments: PaymentInfo[];
}

interface TrackingResponse {
  success: boolean;
  data?: ShipmentData;
  error?: string;
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export default function SiuntosSekimas() {
  const { orderId } = useParams(); // Optional - for backwards compat
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const showDebug = searchParams.get('debug') === 'true';
  const { isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);

  useEffect(() => {
    const fetchTracking = async () => {
      // Token is required
      if (!token) {
        setError("Nuoroda negalioja arba pasibaigė.");
        setLoading(false);
        return;
      }

      try {
        // Token-only request - orderId optional for backwards compat
        const { data, error: fnError } = await supabase.functions.invoke<TrackingResponse>('tracking', {
          body: { token, ...(orderId && { orderId }) }
        });

        if (fnError || !data?.success) {
          setError(data?.error || "Nuoroda negalioja arba pasibaigė.");
        } else if (data.data) {
          setShipment(data.data);
        }
      } catch (e) {
        setError("Klaida kraunant duomenis. Bandykite vėliau.");
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [orderId, token]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('lt-LT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (date: string) => {
    return new Date(date).toLocaleDateString('lt-LT', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getOrderStatusInfo = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'created': { label: 'Sukurtas', color: 'bg-muted text-muted-foreground' },
      'deposit_paid': { label: 'Depozitas sumokėtas', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
      'awaiting_balance': { label: 'Laukiama likučio', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
      'balance_paid': { label: 'Pilnai apmokėtas', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
      'packed': { label: 'Supakuota', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
      'shipped': { label: 'Išsiųsta', color: 'bg-primary/10 text-primary border-primary/30' },
      'delivered': { label: 'Pristatyta', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
      'cancelled': { label: 'Atšaukta', color: 'bg-destructive/10 text-destructive border-destructive/30' },
      'refunded': { label: 'Grąžinta', color: 'bg-muted text-muted-foreground' },
    };
    return statuses[status] || { label: status, color: 'bg-muted text-muted-foreground' };
  };

  const getShipmentStatusInfo = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'pending': { label: 'Ruošiama', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
      'packed': { label: 'Supakuota', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
      'shipped': { label: 'Išsiųsta', color: 'bg-primary/10 text-primary border-primary/30' },
      'in_transit': { label: 'Kelyje', color: 'bg-primary/10 text-primary border-primary/30' },
      'delivered': { label: 'Pristatyta', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
    };
    return statuses[status] || { label: status, color: 'bg-muted text-muted-foreground' };
  };

  const getCarrierName = (code: string | null) => {
    const carriers: Record<string, string> = {
      'omniva': 'Omniva',
      'lp_express': 'LP EXPRESS',
      'dpd': 'DPD',
      'courier': 'Kurjeris',
      'other': 'Kitas',
    };
    return code ? carriers[code] || code : null;
  };

  const getTimelineSteps = () => {
    if (!shipment) return [];

    const steps = [];

    // Step 1: Order confirmed / Deposit paid
    const isFullPayment = !shipment.preorder_flag || shipment.balance_eur === 0;
    steps.push({
      id: 'deposit',
      label: isFullPayment ? 'Užsakymas apmokėtas' : 'Depozitas sumokėtas',
      date: shipment.deposit_paid_at,
      completed: !!shipment.deposit_paid_at,
      icon: CreditCard,
      amount: formatPrice(shipment.deposit_eur),
    });

    // Step 2: Balance paid (if applicable)
    if (shipment.balance_eur > 0) {
      steps.push({
        id: 'balance',
        label: shipment.balance_paid_at ? 'Likutis sumokėtas' : 'Laukiama likučio apmokėjimo',
        date: shipment.balance_paid_at,
        completed: !!shipment.balance_paid_at,
        icon: DollarSign,
        amount: formatPrice(shipment.balance_eur),
        pending: !shipment.balance_paid_at && shipment.order_status === 'awaiting_balance',
      });
    }

    // Step 3: Packed
    steps.push({
      id: 'packed',
      label: 'Supakuota',
      date: shipment.packed_at,
      completed: !!shipment.packed_at,
      icon: Box,
    });

    // Step 4: Shipped
    steps.push({
      id: 'shipped',
      label: 'Išsiųsta',
      date: shipment.shipped_at,
      completed: !!shipment.shipped_at,
      icon: Truck,
    });

    // Add carrier events if shipped
    const carrierEvents = shipment.events.filter(e => e.source === 'carrier');
    if (carrierEvents.length > 0) {
      const latestCarrierEvent = carrierEvents[0];
      if (latestCarrierEvent.status_code !== 'delivered') {
        steps.push({
          id: 'in_transit',
          label: latestCarrierEvent.description || 'Kelyje',
          date: latestCarrierEvent.occurred_at,
          completed: true,
          icon: MapPin,
          location: latestCarrierEvent.location,
        } as any);
      }
    }

    // Step 5: Delivered
    steps.push({
      id: 'delivered',
      label: 'Pristatyta',
      date: shipment.delivered_at,
      completed: !!shipment.delivered_at,
      icon: Package,
    });

    return steps;
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Kraunama siuntos informacija...</p>
        </div>
      </PageLayout>
    );
  }

  if (error || !shipment) {
    return (
      <PageLayout>
        <div className="container py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="font-heading text-2xl font-bold mb-3">Nuoroda negalioja</h1>
            <p className="text-muted-foreground">
              {error || "Nuoroda negalioja arba pasibaigė. Jei turite klausimų, susisiekite su mumis."}
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const orderStatusInfo = getOrderStatusInfo(shipment.order_status);
  const shipmentStatusInfo = getShipmentStatusInfo(shipment.shipment_status);
  const timelineSteps = getTimelineSteps();
  const carrierName = getCarrierName(shipment.carrier_code);

  return (
    <PageLayout>
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
          {/* Left column - Main content */}
          <div className="space-y-6">
            {/* Hero / Summary */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-premium">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Užsakymas</p>
                  <h1 className="font-heading text-2xl md:text-3xl font-bold">
                    #{shipment.order_number}
                  </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={`${orderStatusInfo.color} text-sm px-3 py-1`}>
                    {orderStatusInfo.label}
                  </Badge>
                  {shipment.shipment_status !== 'pending' && (
                    <Badge variant="outline" className={`${shipmentStatusInfo.color} text-sm px-3 py-1`}>
                      Siunta: {shipmentStatusInfo.label}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Paskutinis atnaujinimas: {formatDate(shipment.last_update)}
              </p>

              {/* Preorder ETA */}
              {shipment.preorder_flag && shipment.eta_weeks_min && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Numatomas atvykimas:</span>
                    <span className="font-medium">
                      {shipment.eta_weeks_min}–{shipment.eta_weeks_max || shipment.eta_weeks_min} savaičių
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-premium">
              <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Mokėjimo informacija
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{shipment.preorder_flag && shipment.balance_eur > 0 ? 'Depozitas' : 'Mokėjimas'}</p>
                  <p className="font-semibold text-green-600">{formatPrice(shipment.deposit_eur)}</p>
                  {shipment.deposit_paid_at ? (
                    <p className="text-xs text-green-600 mt-1">✓ Sumokėtas</p>
                  ) : (
                    <p className="text-xs text-yellow-600 mt-1">⏳ Laukiama</p>
                  )}
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Likutis</p>
                  <p className={`font-semibold ${shipment.balance_paid_at ? 'text-green-600' : 'text-yellow-600'}`}>
                    {formatPrice(shipment.balance_eur)}
                  </p>
                  {shipment.balance_paid_at ? (
                    <p className="text-xs text-green-600 mt-1">✓ Sumokėtas</p>
                  ) : shipment.order_status === 'awaiting_balance' ? (
                    <p className="text-xs text-yellow-600 mt-1">⏳ Laukiama apmokėjimo</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Bus prašoma vėliau</p>
                  )}
                </div>
                <div className="p-3 bg-muted/30 rounded-lg col-span-2 md:col-span-1">
                  <p className="text-xs text-muted-foreground mb-1">Iš viso</p>
                  <p className="font-semibold text-lg">{formatPrice(shipment.total_eur)}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-premium">
              <h2 className="font-heading text-lg font-semibold mb-6">Užsakymo kelias</h2>
              
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                
                <div className="space-y-6">
                  {timelineSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isLast = index === timelineSteps.length - 1;
                    const isPending = (step as any).pending;
                    
                    return (
                      <div key={step.id} className="relative flex items-start gap-4">
                        <div 
                          className={`
                            relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                            ${step.completed 
                              ? 'bg-primary text-primary-foreground' 
                              : isPending 
                                ? 'bg-yellow-500 text-white animate-pulse'
                                : 'bg-muted text-muted-foreground border-2 border-border'
                            }
                          `}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className={`flex-1 pb-2 ${!isLast ? 'border-b border-border' : ''}`}>
                          <div className="flex items-center justify-between gap-2">
                            <p className={`font-medium ${step.completed ? 'text-foreground' : isPending ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                              {step.label}
                            </p>
                            {step.date && (
                              <span className="text-sm text-muted-foreground">
                                {formatDateShort(step.date)}
                              </span>
                            )}
                          </div>
                          {(step as any).amount && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {(step as any).amount}
                            </p>
                          )}
                          {(step as any).location && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {(step as any).location}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Map */}
            {(shipment.current_location || shipment.coordinates) && (
              <TrackingMap
                location={shipment.current_location}
                coordinates={shipment.coordinates}
                carrierName={carrierName}
                lastUpdate={shipment.last_update}
              />
            )}
          </div>

          {/* Right column - Order summary */}
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Order Items */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-premium">
              <h3 className="font-heading font-semibold mb-4">Užsakymo prekės</h3>
              <div className="space-y-3">
                {shipment.items.map((item, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">
                      {formatPrice(item.unit_price_eur * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between font-bold">
                  <span>Iš viso</span>
                  <span>{formatPrice(shipment.total_eur)}</span>
                </div>
              </div>
            </div>

            {/* Shipment Details */}
            {(shipment.carrier_code || shipment.tracking_number) && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-premium">
                <h3 className="font-heading font-semibold mb-4">Siuntos detalės</h3>
                <div className="space-y-2">
                  {carrierName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vežėjas</span>
                      <span className="font-medium">{carrierName}</span>
                    </div>
                  )}
                  {shipment.tracking_number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sekimo nr.</span>
                      <span className="font-mono">{shipment.tracking_number}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Debug Panel */}
            {isAdmin && showDebug && (
              <div className="bg-card border border-yellow-500/30 rounded-2xl p-6 shadow-premium">
                <h3 className="font-heading font-semibold mb-4 flex items-center gap-2 text-yellow-600">
                  <Bug className="w-5 h-5" />
                  Debug Data (Admin Only)
                </h3>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-96">
                  {JSON.stringify(shipment, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
