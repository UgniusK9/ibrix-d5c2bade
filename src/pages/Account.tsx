import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, User, LogOut, Loader2, Tag } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { OrderCard } from '@/components/account/OrderCard';

interface Order {
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
}

interface OrderPayment {
  id: string;
  order_id: string;
  type: 'deposit' | 'balance' | 'refund';
  amount_eur: number;
  status: 'pending' | 'succeeded' | 'failed';
  created_at: string;
}

interface OrderShipment {
  id: string;
  order_id: string;
  status: 'pending' | 'packed' | 'shipped' | 'in_transit' | 'delivered';
  tracking_number: string | null;
  tracking_token: string;
  carrier_code: 'omniva' | 'lp_express' | 'dpd' | 'other' | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

interface ShipmentEvent {
  id: string;
  shipment_id: string;
  status_code: string;
  description: string;
  location_label: string | null;
  lat: number | null;
  lng: number | null;
  occurred_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  title_snapshot: string;
  quantity: number;
  unit_price_eur: number;
  unit_deposit_eur: number;
}

interface Offer {
  id: string;
  title: string;
  description: string | null;
  type: 'percent' | 'fixed';
  value: number;
  code: string;
  ends_at: string | null;
}

export default function Account() {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [shipments, setShipments] = useState<OrderShipment[]>([]);
  const [shipmentEvents, setShipmentEvents] = useState<ShipmentEvent[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Load orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, order_number, status, total_eur, deposit_total_eur, balance_total_eur, created_at, paid_at, balance_paid_at, shipping_address_json, preorder_flag, preorder_eta_weeks_min, preorder_eta_weeks_max')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersData) {
          setOrders(ordersData as Order[]);

          const orderIds = ordersData.map(o => o.id);
          
          if (orderIds.length > 0) {
            // Load payments for these orders
            const { data: paymentsData } = await supabase
              .from('payments')
              .select('id, order_id, type, amount_eur, status, created_at')
              .in('order_id', orderIds);
            
            if (paymentsData) {
              setPayments(paymentsData as OrderPayment[]);
            }

            // Load shipments
            const { data: shipmentsData } = await supabase
              .from('shipments')
              .select('id, order_id, status, tracking_number, tracking_token, carrier_code, shipped_at, delivered_at')
              .in('order_id', orderIds);
            
            if (shipmentsData) {
              setShipments(shipmentsData as OrderShipment[]);
              
              // Load shipment events for all shipments
              const shipmentIds = shipmentsData.map(s => s.id);
              if (shipmentIds.length > 0) {
                const { data: eventsData } = await supabase
                  .from('shipment_events')
                  .select('id, shipment_id, status_code, description, location_label, lat, lng, occurred_at')
                  .in('shipment_id', shipmentIds)
                  .order('occurred_at', { ascending: false });
                
                if (eventsData) {
                  setShipmentEvents(eventsData as ShipmentEvent[]);
                }
              }
            }

            // Load order items
            const { data: itemsData } = await supabase
              .from('order_items')
              .select('id, order_id, title_snapshot, quantity, unit_price_eur, unit_deposit_eur')
              .in('order_id', orderIds);
            
            if (itemsData) {
              setOrderItems(itemsData as OrderItem[]);
            }
          }
        }

        // Load user's targeted offers
        const { data: targetedOffers } = await supabase
          .from('offer_targets')
          .select(`
            offer:offers (
              id, title, description, type, value, code, ends_at, active
            )
          `)
          .eq('user_id', user.id);

        if (targetedOffers) {
          const activeOffers = targetedOffers
            .filter((t: unknown) => (t as { offer: { active: boolean } })?.offer?.active)
            .map((t: unknown) => (t as { offer: Offer }).offer);
          setOffers(activeOffers);
        }
      } catch (e) {
        console.error('Error loading account data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lt-LT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getPaymentsForOrder = (orderId: string) => {
    return payments.filter(p => p.order_id === orderId);
  };

  const getShipmentForOrder = (orderId: string) => {
    return shipments.find(s => s.order_id === orderId);
  };

  const getItemsForOrder = (orderId: string) => {
    return orderItems.filter(i => i.order_id === orderId);
  };

  const getShipmentEventsForOrder = (orderId: string) => {
    const shipment = getShipmentForOrder(orderId);
    if (!shipment) return [];
    return shipmentEvents.filter(e => e.shipment_id === shipment.id);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-8 md:py-12 max-w-4xl">
        {/* Profile header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{user?.email}</p>
                <p className="text-sm text-muted-foreground">Klientas</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Atsijungti
            </Button>
          </div>
        </div>

        {/* My Deals */}
        {offers.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Mano pasiūlymai
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-card border border-primary/30 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{offer.title}</h3>
                      {offer.description && (
                        <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                      )}
                    </div>
                    <Badge className="bg-primary text-primary-foreground">
                      {offer.type === 'percent' ? `-${offer.value}%` : `-${formatPrice(offer.value)}`}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{offer.code}</code>
                    {offer.ends_at && (
                      <span className="text-xs text-muted-foreground">
                        Galioja iki: {new Date(offer.ends_at).toLocaleDateString('lt-LT')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        <div>
          <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Mano užsakymai
          </h2>

          {orders.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Užsakymų dar nėra</p>
              <Button asChild className="mt-4">
                <Link to="/varikliai">Peržiūrėti produktus</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  payments={getPaymentsForOrder(order.id)}
                  shipment={getShipmentForOrder(order.id)}
                  shipmentEvents={getShipmentEventsForOrder(order.id)}
                  items={getItemsForOrder(order.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
