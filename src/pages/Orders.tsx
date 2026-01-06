import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Loader2, Search, Filter, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { OrderCard } from '@/components/account/OrderCard';
import { RefundRequestForm } from '@/components/refund/RefundRequestForm';
import { toast } from 'sonner';

interface RefundOrder {
  id: string;
  orderNumber: string;
  maxAmount: number;
}

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
  packed_at: string | null;
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

interface BalanceRequest {
  id: string;
  order_id: string;
  payment_url: string | null;
  message: string | null;
  sent_at: string;
}

const statusOptions = [
  { value: 'all', label: 'Visi užsakymai' },
  { value: 'created', label: 'Sukurtas' },
  { value: 'deposit_paid', label: 'Depozitas sumokėtas' },
  { value: 'awaiting_balance', label: 'Laukia likučio' },
  { value: 'balance_paid', label: 'Pilnai apmokėtas' },
  { value: 'packed', label: 'Supakuotas' },
  { value: 'shipped', label: 'Išsiųstas' },
  { value: 'delivered', label: 'Pristatytas' },
  { value: 'cancelled', label: 'Atšauktas' },
  { value: 'refunded', label: 'Grąžintas' },
];

export default function Orders() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [shipments, setShipments] = useState<OrderShipment[]>([]);
  const [shipmentEvents, setShipmentEvents] = useState<ShipmentEvent[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [balanceRequests, setBalanceRequests] = useState<BalanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundOrder, setRefundOrder] = useState<RefundOrder | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, order_number, status, total_eur, deposit_total_eur, balance_total_eur, created_at, paid_at, balance_paid_at, shipping_address_json, preorder_flag, preorder_eta_weeks_min, preorder_eta_weeks_max')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersData) {
          setOrders(ordersData as Order[]);

          const orderIds = ordersData.map(o => o.id);
          
          if (orderIds.length > 0) {
            const { data: paymentsData } = await supabase
              .from('payments')
              .select('id, order_id, type, amount_eur, status, created_at')
              .in('order_id', orderIds);
            
            if (paymentsData) setPayments(paymentsData as OrderPayment[]);

            const { data: shipmentsData } = await supabase
              .from('shipments')
              .select('id, order_id, status, tracking_number, tracking_token, carrier_code, shipped_at, delivered_at, packed_at')
              .in('order_id', orderIds);
            
            if (shipmentsData) {
              setShipments(shipmentsData as OrderShipment[]);
              
              const shipmentIds = shipmentsData.map(s => s.id);
              if (shipmentIds.length > 0) {
                const { data: eventsData } = await supabase
                  .from('shipment_events')
                  .select('id, shipment_id, status_code, description, location_label, lat, lng, occurred_at')
                  .in('shipment_id', shipmentIds)
                  .order('occurred_at', { ascending: false });
                
                if (eventsData) setShipmentEvents(eventsData as ShipmentEvent[]);
              }
            }

            const { data: itemsData } = await supabase
              .from('order_items')
              .select('id, order_id, title_snapshot, quantity, unit_price_eur, unit_deposit_eur')
              .in('order_id', orderIds);
            
            if (itemsData) setOrderItems(itemsData as OrderItem[]);

            const { data: balanceRequestsData } = await supabase
              .from('balance_requests')
              .select('id, order_id, payment_url, message, sent_at')
              .in('order_id', orderIds)
              .order('sent_at', { ascending: false });
            
            if (balanceRequestsData) setBalanceRequests(balanceRequestsData as BalanceRequest[]);
          }
        }
      } catch (e) {
        console.error('Error loading orders:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const getPaymentsForOrder = (orderId: string) => payments.filter(p => p.order_id === orderId);
  const getShipmentForOrder = (orderId: string) => shipments.find(s => s.order_id === orderId);
  const getItemsForOrder = (orderId: string) => orderItems.filter(i => i.order_id === orderId);
  const getShipmentEventsForOrder = (orderId: string) => {
    const shipment = getShipmentForOrder(orderId);
    if (!shipment) return [];
    return shipmentEvents.filter(e => e.shipment_id === shipment.id);
  };
  const getBalanceRequestForOrder = (orderId: string) => balanceRequests.find(br => br.order_id === orderId) || null;

  const handleRefundSuccess = () => {
    setRefundOrder(null);
    toast.success(t('account.supportSent'));
  };

  const handleRequestRefund = (order: Order) => {
    const orderPayments = getPaymentsForOrder(order.id);
    const totalPaid = orderPayments
      .filter(p => p.status === 'succeeded' && p.type !== 'refund')
      .reduce((sum, p) => sum + p.amount_eur, 0);
    
    setRefundOrder({
      id: order.id,
      orderNumber: order.order_number,
      maxAmount: totalPaid || order.deposit_total_eur,
    });
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const activeOrders = orders.filter(o => !['delivered', 'cancelled', 'refunded'].includes(o.status)).length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

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
        {/* Back Button */}
        <Link 
          to="/account" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('orders.backToAccount')}
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">{t('orders.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('orders.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="px-3 py-1.5">
              <Package className="w-4 h-4 mr-2" />
              {t('orders.active')}: {activeOrders}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1.5">
              {t('orders.delivered')}: {deliveredOrders}
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('orders.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {orders.length === 0 ? t('account.noOrders') : t('orders.noResults')}
            </p>
            {orders.length === 0 && (
              <Button asChild className="mt-4">
                <Link to="/produktai/visi">{t('nav.viewConstructors')}</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                payments={getPaymentsForOrder(order.id)}
                shipment={getShipmentForOrder(order.id)}
                shipmentEvents={getShipmentEventsForOrder(order.id)}
                items={getItemsForOrder(order.id)}
                balanceRequest={getBalanceRequestForOrder(order.id)}
                onRequestRefund={() => handleRequestRefund(order)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundOrder && (
        <RefundRequestForm
          orderId={refundOrder.id}
          orderNumber={refundOrder.orderNumber}
          maxAmount={refundOrder.maxAmount}
          isOpen={!!refundOrder}
          onClose={() => setRefundOrder(null)}
          onSuccess={handleRefundSuccess}
        />
      )}
    </PageLayout>
  );
}
