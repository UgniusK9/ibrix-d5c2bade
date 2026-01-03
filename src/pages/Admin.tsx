import { useEffect, useState } from "react";
import { Package, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, RefreshCw, CreditCard, DollarSign, Copy, ExternalLink, Settings, List, BarChart3 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ShipmentManager } from "@/components/admin/ShipmentManager";
import { AdminSetup } from "@/components/admin/AdminSetup";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";

type CarrierCode = Database["public"]["Enums"]["carrier_code"];
type ShipmentStatus = Database["public"]["Enums"]["shipment_status"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  total_eur: number;
  deposit_total_eur: number;
  balance_total_eur: number;
  subtotal_eur: number;
  shipping_eur: number;
  discount_eur: number;
  payment_plan: 'deposit_only' | 'full_payment';
  preorder_flag: boolean;
  shipping_address_json: any;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  balance_paid_at: string | null;
}

interface OrderItem {
  id: string;
  title_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_price_eur: number;
  unit_deposit_eur: number;
  category_snapshot: string;
}

interface Shipment {
  id: string;
  carrier_code: CarrierCode;
  tracking_number: string | null;
  tracking_token: string;
  status: ShipmentStatus;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

interface Payment {
  id: string;
  type: 'deposit' | 'balance' | 'refund';
  status: 'pending' | 'succeeded' | 'failed';
  amount_eur: number;
  stripe_checkout_session_id: string | null;
  created_at: string;
}

interface WebhookHealth {
  status: string;
  config: {
    stripe_secret_configured: boolean;
    webhook_secret_configured: boolean;
    supabase_url_configured: boolean;
    service_role_configured: boolean;
    resend_configured: boolean;
  };
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderShipment, setOrderShipment] = useState<Shipment | null>(null);
  const [orderPayments, setOrderPayments] = useState<Payment[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [requestingBalance, setRequestingBalance] = useState(false);
  const [balancePaymentUrl, setBalancePaymentUrl] = useState<string | null>(null);
  const [webhookHealth, setWebhookHealth] = useState<WebhookHealth | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin', {
        body: { action: 'list_orders' }
      });

      if (error) throw error;
      if (data?.orders) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookHealth = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook?health=true`,
        { method: 'GET' }
      );
      const data = await response.json();
      setWebhookHealth(data);
    } catch (e) {
      console.error('Failed to load webhook health:', e);
    }
  };

  useEffect(() => {
    loadOrders();
    loadWebhookHealth();
  }, []);

  const openOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
    setOrderShipment(null);
    setOrderItems([]);
    setOrderPayments([]);
    setBalancePaymentUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('admin', {
        body: { action: 'get_order', orderId: order.id }
      });

      if (error) throw error;
      if (data) {
        setOrderItems(data.items || []);
        setOrderShipment(data.shipment || null);
        setOrderPayments(data.payments || []);
      }
    } catch (e) {
      console.error('Failed to load order details:', e);
    }
  };

  const refreshOrderDetails = async () => {
    if (!selectedOrder) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('admin', {
        body: { action: 'get_order', orderId: selectedOrder.id }
      });

      if (error) throw error;
      if (data) {
        setOrderShipment(data.shipment || null);
        setOrderPayments(data.payments || []);
        setSelectedOrder(prev => prev ? { ...prev, status: data.order?.status || prev.status } : null);
      }
    } catch (e) {
      console.error('Failed to refresh order details:', e);
    }
  };

  const requestBalancePayment = async () => {
    if (!selectedOrder) return;
    
    setRequestingBalance(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-balance-payment', {
        body: { orderId: selectedOrder.id }
      });

      if (error) throw error;
      
      if (data?.success && data?.paymentUrl) {
        setBalancePaymentUrl(data.paymentUrl);
        toast.success('Mokėjimo nuoroda sukurta!');
        await refreshOrderDetails();
        await loadOrders();
      } else {
        toast.error(data?.error || 'Nepavyko sukurti mokėjimo nuorodos');
      }
    } catch (e: any) {
      console.error('Failed to request balance payment:', e);
      toast.error(e.message || 'Klaida kuriant mokėjimo nuorodą');
    } finally {
      setRequestingBalance(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Nukopijuota!');
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig: Record<OrderStatus, { label: string; className: string; icon: React.ReactNode }> = {
      'created': { 
        label: 'Sukurtas', 
        className: 'bg-muted text-muted-foreground',
        icon: <AlertCircle className="w-3 h-3" />
      },
      'deposit_paid': { 
        label: 'Depozitas sumokėtas', 
        className: 'bg-green-500/10 text-green-600 border-green-500/30',
        icon: <CreditCard className="w-3 h-3" />
      },
      'awaiting_balance': { 
        label: 'Laukia likučio', 
        className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
        icon: <Clock className="w-3 h-3" />
      },
      'balance_paid': { 
        label: 'Pilnai apmokėtas', 
        className: 'bg-green-500/10 text-green-600 border-green-500/30',
        icon: <CheckCircle2 className="w-3 h-3" />
      },
      'packed': { 
        label: 'Supakuotas', 
        className: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
        icon: <Package className="w-3 h-3" />
      },
      'shipped': { 
        label: 'Išsiųstas', 
        className: 'bg-primary/10 text-primary border-primary/30',
        icon: <Package className="w-3 h-3" />
      },
      'delivered': { 
        label: 'Pristatytas', 
        className: 'bg-green-500/10 text-green-600 border-green-500/30',
        icon: <CheckCircle2 className="w-3 h-3" />
      },
      'cancelled': { 
        label: 'Atšauktas', 
        className: 'bg-destructive/10 text-destructive border-destructive/30',
        icon: <XCircle className="w-3 h-3" />
      },
      'refunded': { 
        label: 'Grąžintas', 
        className: 'bg-muted text-muted-foreground',
        icon: <RefreshCw className="w-3 h-3" />
      },
    };

    const config = statusConfig[status] || statusConfig['created'];

    return (
      <Badge variant="outline" className={`${config.className} gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('lt-LT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageLayout>
      <div className="container py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">Administravimas</h1>
            <p className="text-muted-foreground">Užsakymų ir sistemos valdymas</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/verification">
                <BarChart3 className="w-4 h-4 mr-2" />
                Patikra
              </Link>
            </Button>
            <Button onClick={loadOrders} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atnaujinti
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="orders" className="gap-2">
              <List className="w-4 h-4" />
              Užsakymai
            </TabsTrigger>
            <TabsTrigger value="setup" className="gap-2">
              <Settings className="w-4 h-4" />
              Nustatymai
            </TabsTrigger>
          </TabsList>

          {/* ORDERS TAB */}
          <TabsContent value="orders">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-2">Kraunama...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold mb-2">Nėra užsakymų</h2>
                <p className="text-muted-foreground">
                  Kai klientai pateiks užsakymus, jie bus rodomi čia.
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Užsakymas</TableHead>
                      <TableHead>Klientas</TableHead>
                      <TableHead>Statusas</TableHead>
                      <TableHead>Depozitas / Likutis</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Suma</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow 
                        key={order.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openOrderDetails(order)}
                      >
                        <TableCell className="font-mono font-medium">
                          <div>
                            {order.order_number}
                            {order.preorder_flag && (
                              <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary">
                                Pre-order
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.first_name} {order.last_name}</p>
                            <p className="text-xs text-muted-foreground">{order.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="text-green-600">{formatPrice(order.deposit_total_eur)}</span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-yellow-600">{formatPrice(order.balance_total_eur)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPrice(order.total_eur)}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* SETUP TAB */}
          <TabsContent value="setup">
            <AdminSetup webhookHealth={webhookHealth} />
          </TabsContent>
        </Tabs>

        {/* Order Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">
                Užsakymas {selectedOrder?.order_number}
              </DialogTitle>
              <DialogDescription>
                {selectedOrder && formatDate(selectedOrder.created_at)}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Statusas:</span>
                  {getStatusBadge(selectedOrder.status)}
                  {selectedOrder.preorder_flag && (
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Pre-order
                    </Badge>
                  )}
                </div>

                {/* Payment Summary */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Mokėjimo informacija
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Depozitas</span>
                      <p className="font-semibold text-green-600">{formatPrice(selectedOrder.deposit_total_eur)}</p>
                      {selectedOrder.paid_at && (
                        <p className="text-xs text-muted-foreground">
                          Sumokėtas: {formatDate(selectedOrder.paid_at)}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Likutis</span>
                      <p className={`font-semibold ${selectedOrder.balance_paid_at ? 'text-green-600' : 'text-yellow-600'}`}>
                        {formatPrice(selectedOrder.balance_total_eur)}
                      </p>
                      {selectedOrder.balance_paid_at ? (
                        <p className="text-xs text-green-600">
                          ✓ Sumokėtas: {formatDate(selectedOrder.balance_paid_at)}
                        </p>
                      ) : (
                        <p className="text-xs text-yellow-600">
                          Nesumokėtas
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Request Balance Button */}
                  {(selectedOrder.status === 'deposit_paid' || selectedOrder.status === 'awaiting_balance') && !selectedOrder.balance_paid_at && (
                    <div className="mt-4 space-y-3">
                      <Button 
                        size="sm" 
                        className="w-full" 
                        onClick={requestBalancePayment}
                        disabled={requestingBalance}
                      >
                        {requestingBalance ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Kuriama nuoroda...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Generuoti likučio apmokėjimo nuorodą
                          </>
                        )}
                      </Button>
                      
                      {balancePaymentUrl && (
                        <div className="bg-background border border-border rounded-lg p-3 space-y-2">
                          <p className="text-xs text-muted-foreground">Mokėjimo nuoroda:</p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              readOnly 
                              value={balancePaymentUrl}
                              className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono truncate"
                            />
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyToClipboard(balancePaymentUrl)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(balancePaymentUrl, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payments list */}
                  {orderPayments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Mokėjimų istorija:</p>
                      <div className="space-y-1">
                        {orderPayments.map((payment) => (
                          <div key={payment.id} className="flex justify-between text-xs">
                            <span className="capitalize">
                              {payment.type === 'deposit' ? 'Depozitas' : payment.type === 'balance' ? 'Likutis' : 'Grąžinimas'}
                            </span>
                            <span className={
                              payment.status === 'succeeded' ? 'text-green-600' : 
                              payment.status === 'pending' ? 'text-yellow-600' : 
                              'text-red-600'
                            }>
                              {formatPrice(payment.amount_eur)} • {payment.status === 'succeeded' ? '✓' : payment.status === 'pending' ? '⏳' : '✗'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer info */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Klientas</h3>
                  <p>{selectedOrder.first_name} {selectedOrder.last_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.email}</p>
                  {selectedOrder.phone && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.phone}</p>
                  )}
                </div>

                {/* Shipping */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Pristatymas</h3>
                  {selectedOrder.shipping_address_json && (
                    <div className="text-sm text-muted-foreground">
                      {selectedOrder.shipping_address_json.street && (
                        <p>{selectedOrder.shipping_address_json.street}</p>
                      )}
                      {selectedOrder.shipping_address_json.city && (
                        <p>{selectedOrder.shipping_address_json.city} {selectedOrder.shipping_address_json.postalCode}</p>
                      )}
                      {selectedOrder.shipping_address_json.lockerAddress && (
                        <p>{selectedOrder.shipping_address_json.lockerAddress}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Order items */}
                <div>
                  <h3 className="font-semibold mb-3">Prekės</h3>
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex-1">
                          <p className="font-medium">{item.title_snapshot}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.sku_snapshot}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">× {item.quantity}</span>
                            <span className="text-xs text-green-600">
                              Depozitas: {formatPrice(item.unit_deposit_eur * item.quantity)}
                            </span>
                          </div>
                        </div>
                        <p className="font-semibold">
                          {formatPrice(item.unit_price_eur * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipment Manager */}
                <ShipmentManager
                  orderId={selectedOrder.id}
                  orderNumber={selectedOrder.order_number}
                  shipment={orderShipment}
                  onUpdate={refreshOrderDetails}
                />

                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prekės</span>
                      <span>{formatPrice(selectedOrder.subtotal_eur)}</span>
                    </div>
                    {selectedOrder.discount_eur > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Nuolaida</span>
                        <span className="text-green-600">-{formatPrice(selectedOrder.discount_eur)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pristatymas</span>
                      <span>{selectedOrder.shipping_eur === 0 ? 'Nemokamas' : formatPrice(selectedOrder.shipping_eur)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border font-bold text-lg">
                      <span>Iš viso</span>
                      <span className="text-accent">{formatPrice(selectedOrder.total_eur)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Pastabos</h3>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
