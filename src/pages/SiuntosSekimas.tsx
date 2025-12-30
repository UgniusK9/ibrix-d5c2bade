import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Package, CheckCircle2, Truck, MapPin, Clock, AlertCircle, Box } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ShipmentEvent {
  id: string;
  status_code: string;
  description: string;
  location: string | null;
  occurred_at: string;
  source: 'internal' | 'carrier';
}

interface ShipmentData {
  order_number: string;
  status: string;
  carrier_code: string | null;
  tracking_number: string | null;
  created_at: string;
  paid_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  last_update: string;
  events: ShipmentEvent[];
  items: Array<{
    title: string;
    quantity: number;
  }>;
}

interface TrackingResponse {
  success: boolean;
  data?: ShipmentData;
  error?: string;
}

export default function SiuntosSekimas() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!orderId || !token) {
        setError("Nuoroda negalioja arba pasibaigė.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke<TrackingResponse>('tracking', {
          body: { orderId, token }
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

  const getStatusInfo = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'pending': { label: 'Ruošiama', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
      'packed': { label: 'Supakuota', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
      'shipped': { label: 'Išsiųsta', color: 'bg-primary/10 text-primary border-primary/30' },
      'in_transit': { label: 'Kelyje', color: 'bg-primary/10 text-primary border-primary/30' },
      'out_for_delivery': { label: 'Pristatoma', color: 'bg-accent/10 text-accent border-accent/30' },
      'delivered': { label: 'Pristatyta', color: 'bg-success/10 text-success border-success/30' },
      'exception': { label: 'Nesklandumas', color: 'bg-destructive/10 text-destructive border-destructive/30' },
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

    const steps = [
      {
        id: 'confirmed',
        label: 'Užsakymas patvirtintas',
        date: shipment.paid_at || shipment.created_at,
        completed: true,
        icon: CheckCircle2,
      },
      {
        id: 'packed',
        label: 'Supakuota',
        date: shipment.packed_at,
        completed: !!shipment.packed_at,
        icon: Box,
      },
      {
        id: 'shipped',
        label: 'Išsiųsta',
        date: shipment.shipped_at,
        completed: !!shipment.shipped_at,
        icon: Truck,
      },
    ];

    // Add carrier events
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

  const statusInfo = getStatusInfo(shipment.status);
  const timelineSteps = getTimelineSteps();

  return (
    <PageLayout>
      <div className="container py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Hero / Summary */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6 shadow-premium">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Užsakymas</p>
                <h1 className="font-heading text-2xl md:text-3xl font-bold">
                  #{shipment.order_number}
                </h1>
              </div>
              <Badge variant="outline" className={`${statusInfo.color} text-sm px-4 py-2`}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Paskutinis atnaujinimas: {formatDate(shipment.last_update)}
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6 shadow-premium">
            <h2 className="font-heading text-lg font-semibold mb-6">Siuntos kelias</h2>
            
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-6">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === timelineSteps.length - 1;
                  
                  return (
                    <div key={step.id} className="relative flex items-start gap-4">
                      {/* Icon */}
                      <div 
                        className={`
                          relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                          ${step.completed 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground border-2 border-border'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      {/* Content */}
                      <div className={`flex-1 pb-2 ${!isLast ? 'border-b border-border' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </p>
                          {step.date && (
                            <span className="text-sm text-muted-foreground">
                              {formatDateShort(step.date)}
                            </span>
                          )}
                        </div>
                        {(step as any).location && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {(step as any).location}
                          </p>
                        )}
                        {!step.completed && step.id === 'shipped' && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Kai išsiųsime – čia atsiras sekimo informacija.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          {(shipment.carrier_code || shipment.tracking_number) && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6 shadow-premium">
              <h2 className="font-heading text-lg font-semibold mb-4">Siuntos detalės</h2>
              <div className="grid gap-3">
                {shipment.carrier_code && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vežėjas</span>
                    <span className="font-medium">{getCarrierName(shipment.carrier_code)}</span>
                  </div>
                )}
                {shipment.tracking_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sekimo numeris</span>
                    <span className="font-mono text-sm">{shipment.tracking_number}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          {shipment.items.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-premium">
              <h2 className="font-heading text-lg font-semibold mb-4">Užsakymo turinys</h2>
              <div className="space-y-3">
                {shipment.items.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">Kiekis: {item.quantity}</p>
                    </div>
                  </div>
                ))}
                {shipment.items.length > 4 && (
                  <p className="text-sm text-muted-foreground">
                    ...ir dar {shipment.items.length - 4} prekės
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
