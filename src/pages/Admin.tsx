import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, RefreshCw } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCartPrice } from "@/stores/cartStore";
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

interface Order {
  id: string;
  order_number: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  total_cents: number;
  subtotal_cents: number;
  shipping_cents: number;
  shipping_method: string;
  shipping_address_json: any;
  notes: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  title_snapshot: string;
  quantity: number;
  unit_price_cents: number;
  type: 'in_stock' | 'pre_order';
  preorder_eta_weeks_snapshot: number | null;
}

export default function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);

    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    setOrderItems(data || []);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      'draft': { 
        label: 'Juodraštis', 
        className: 'bg-muted text-muted-foreground',
        icon: <AlertCircle className="w-3 h-3" />
      },
      'pending_payment': { 
        label: 'Laukia apmokėjimo', 
        className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
        icon: <Clock className="w-3 h-3" />
      },
      'paid': { 
        label: 'Apmokėtas', 
        className: 'bg-success/10 text-success border-success/30',
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
      'failed': { 
        label: 'Nepavyko', 
        className: 'bg-destructive/10 text-destructive border-destructive/30',
        icon: <XCircle className="w-3 h-3" />
      },
    };

    const config = statusConfig[status] || statusConfig['draft'];

    return (
      <Badge variant="outline" className={`${config.className} gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getShippingMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'omniva_locker': 'Omniva',
      'lp_express_locker': 'LP EXPRESS',
      'dpd_locker': 'DPD',
      'courier': 'Kurjeris',
    };
    return methods[method] || method;
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
            <h1 className="font-heading text-3xl font-bold">Užsakymai</h1>
            <p className="text-muted-foreground">Admin valdymo skydelis</p>
          </div>
          <Button onClick={loadOrders} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atnaujinti
          </Button>
        </div>

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
                  <TableHead>Pristatymas</TableHead>
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
                      {order.order_number}
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
                      {getShippingMethodName(order.shipping_method)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCartPrice(order.total_cents)}
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
                  <p>{getShippingMethodName(selectedOrder.shipping_method)}</p>
                  {selectedOrder.shipping_address_json && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedOrder.shipping_address_json.lockerAddress || 
                       `${selectedOrder.shipping_address_json.street}, ${selectedOrder.shipping_address_json.city} ${selectedOrder.shipping_address_json.postalCode}`}
                    </p>
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
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${item.type === 'pre_order' ? 'border-primary/50 text-primary' : 'border-success/50 text-success'}`}
                            >
                              {item.type === 'pre_order' ? 'Pre-order' : 'Sandėlyje'}
                            </Badge>
                            {item.preorder_eta_weeks_snapshot && (
                              <span className="text-xs text-muted-foreground">
                                ETA: {item.preorder_eta_weeks_snapshot} sav.
                              </span>
                            )}
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
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prekės</span>
                      <span>{formatCartPrice(selectedOrder.subtotal_cents)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pristatymas</span>
                      <span>{selectedOrder.shipping_cents === 0 ? 'Nemokamas' : formatCartPrice(selectedOrder.shipping_cents)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border font-bold text-lg">
                      <span>Iš viso</span>
                      <span className="text-accent">{formatCartPrice(selectedOrder.total_cents)}</span>
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
