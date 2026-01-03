import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Package, Clock, Truck, Mail, ArrowRight, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCartPrice } from "@/stores/cartStore";
import { trackPurchaseEvent } from "@/hooks/useAnalytics";
interface OrderItem {
  id: string;
  title_snapshot: string;
  quantity: number;
  unit_price_cents: number;
  type: 'in_stock' | 'pre_order';
  preorder_eta_weeks_snapshot: number | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  total_cents: number;
  subtotal_cents: number;
  shipping_cents: number;
  shipping_method: string;
  shipping_address_json: Record<string, string>;
  created_at: string;
}

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order');
  const trackingToken = searchParams.get('token');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const purchaseTracked = useRef(false);

  // Track purchase event once order is loaded
  useEffect(() => {
    if (order && items.length > 0 && !purchaseTracked.current) {
      purchaseTracked.current = true;
      trackPurchaseEvent({
        orderId: order.id,
        orderNumber: order.order_number,
        totalCents: order.total_cents,
        currency: 'EUR',
        items: items.map(item => ({
          id: item.id,
          name: item.title_snapshot,
          price: item.unit_price_cents,
          quantity: item.quantity,
        })),
      });
    }
  }, [order, items]);

  useEffect(() => {
    async function loadOrder() {
      // Validate required parameters
      if (!orderId || !trackingToken) {
        setError('Trūksta užsakymo informacijos');
        setLoading(false);
        return;
      }

      try {
        // Use the tracking edge function which properly validates tokens server-side
        const { data, error: fnError } = await supabase.functions.invoke('tracking', {
          body: { 
            orderId,
            trackingToken
          }
        });

        if (fnError) {
          console.error('Tracking function error:', fnError);
          setError('Nepavyko užkrauti užsakymo');
          setLoading(false);
          return;
        }

        if (!data?.success || !data?.order) {
          setError(data?.error || 'Užsakymas nerastas arba nuoroda nebegalioja');
          setLoading(false);
          return;
        }

        // Map the tracking response to our order format
        const orderData = data.order;
        setOrder({
          id: orderData.id,
          order_number: orderData.order_number,
          status: orderData.status,
          first_name: orderData.first_name,
          last_name: orderData.last_name,
          email: orderData.email,
          total_cents: orderData.total_cents,
          subtotal_cents: orderData.subtotal_cents,
          shipping_cents: orderData.shipping_cents,
          shipping_method: orderData.shipping_method,
          shipping_address_json: orderData.shipping_address_json,
          created_at: orderData.created_at,
        });

        // Map order items from tracking response
        if (data.items && Array.isArray(data.items)) {
          setItems(data.items.map((item: Record<string, unknown>) => ({
            id: item.id as string,
            title_snapshot: item.title_snapshot as string,
            quantity: item.quantity as number,
            unit_price_cents: item.unit_price_cents as number,
            type: item.type as 'in_stock' | 'pre_order',
            preorder_eta_weeks_snapshot: item.preorder_eta_weeks_snapshot as number | null,
          })));
        }
      } catch (err) {
        console.error('Order load error:', err);
        setError('Klaida kraunant užsakymą');
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId, trackingToken]);

  const hasPreorder = items.some(item => item.type === 'pre_order');
  const maxEtaWeeks = items.reduce((max, item) => {
    if (item.preorder_eta_weeks_snapshot) {
      return Math.max(max, item.preorder_eta_weeks_snapshot);
    }
    return max;
  }, 0);

  const getShippingMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'omniva_locker': 'Omniva paštomatas',
      'lp_express_locker': 'LP EXPRESS paštomatas',
      'dpd_locker': 'DPD paštomatas',
      'courier': 'Kurjeris į namus',
    };
    return methods[method] || method;
  };

  const handleTrackOrder = () => {
    if (orderId && trackingToken) {
      navigate(`/siuntos-sekimas?order=${orderId}&token=${trackingToken}`);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container py-16 max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Kraunamas užsakymas...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !order) {
    return (
      <PageLayout>
        <div className="container py-16 max-w-lg mx-auto text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">
            {error || 'Užsakymas nerastas'}
          </h1>
          <p className="text-muted-foreground mb-6">
            Patikrinkite nuorodą arba susisiekite su mumis.
          </p>
          <Button asChild>
            <Link to="/varikliai">Grįžti į parduotuvę</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-8 md:py-16 max-w-2xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="bg-success/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="font-heading text-3xl font-bold mb-2">
            Ačiū už užsakymą!
          </h1>
          <p className="text-muted-foreground">
            Užsakymas sėkmingai sukurtas
          </p>
        </div>

        {/* Order number */}
        <div className="bg-card border border-border rounded-xl p-6 text-center mb-6">
          <p className="text-sm text-muted-foreground mb-1">Užsakymo numeris</p>
          <p className="font-heading text-2xl font-bold text-primary">
            {order.order_number}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Patvirtinimą išsiųsime į {order.email}
          </p>
        </div>

        {/* Pre-order notice */}
        {hasPreorder && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-heading font-semibold">
                Pre-order: {maxEtaWeeks} savaičių pristatymas
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Pre-order prekės bus pristatytos per nurodytą laiką. Atšaukti galima bet kada iki išsiuntimo – grąžiname pilną sumą.
            </p>
          </div>
        )}

        {/* Payment notice */}
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-5 h-5 text-accent" />
            <span className="font-heading font-semibold">Kas toliau?</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Šiuo metu mokėjimai nėra prijungti. Susisieksime su jumis el. paštu dėl apmokėjimo artimiausiomis dienomis.
          </p>
        </div>

        {/* Order items */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading font-semibold mb-4">Užsakymo prekės</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{item.title_snapshot}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${item.type === 'pre_order' ? 'border-primary/50 text-primary' : 'border-success/50 text-success'}`}
                    >
                      {item.type === 'pre_order' ? 'Pre-order' : 'Sandėlyje'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      × {item.quantity}
                    </span>
                  </div>
                </div>
                <p className="font-semibold">
                  {formatCartPrice(item.unit_price_cents * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prekės</span>
              <span>{formatCartPrice(order.subtotal_cents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pristatymas</span>
              <span>{order.shipping_cents === 0 ? 'Nemokamas' : formatCartPrice(order.shipping_cents)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border font-bold text-lg">
              <span>Iš viso</span>
              <span className="text-accent">{formatCartPrice(order.total_cents)}</span>
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold">Pristatymas</h2>
          </div>
          <p className="text-muted-foreground">
            {getShippingMethodName(order.shipping_method)}
          </p>
          {order.shipping_address_json && (
            <p className="text-sm text-muted-foreground mt-1">
              {order.shipping_address_json.lockerAddress || 
               `${order.shipping_address_json.street}, ${order.shipping_address_json.city} ${order.shipping_address_json.postalCode}`}
            </p>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleTrackOrder} variant="outline" size="lg">
            <Truck className="w-4 h-4 mr-2" />
            Sekti siuntą
          </Button>
          <Button asChild size="lg">
            <Link to="/varikliai">
              Tęsti apsipirkimą
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
