import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, RefreshCw, CreditCard, DollarSign, Copy, ExternalLink, Search, Filter, Truck, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ShipmentManager } from '@/components/admin/ShipmentManager';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';

type CarrierCode = Database['public']['Enums']['carrier_code'];
type ShipmentStatus = Database['public']['Enums']['shipment_status'];
type OrderStatus = Database['public']['Enums']['order_status'];

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

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
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

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderShipment, setOrderShipment] = useState<Shipment | null>(null);
  const [orderPayments, setOrderPayments] = useState<Payment[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [requestingBalance, setRequestingBalance] = useState(false);
  const [balancePaymentUrl, setBalancePaymentUrl] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

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

  useEffect(() => {
    loadOrders();
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
        icon: <Box className="w-3 h-3" />
      },
      'shipped': { 
        label: 'Išsiųstas', 
        className: 'bg-primary/10 text-primary border-primary/30',
        icon: <Truck className="w-3 h-3" />
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

  const getPaymentTypeBadge = (type: Payment['type'], status: Payment['status']) => {
    const typeLabels = {
      'deposit': 'Depozitas',
      'balance': 'Likutis',
      'refund': 'Grąžinimas',
    };
    const statusColors = {
      'pending': 'bg-yellow-500/10 text-yellow-600',
      'succeeded': 'bg-green-500/10 text-green-600',
      'failed': 'bg-destructive/10 text-destructive',
    };
    return (
      <Badge variant="outline" className={statusColors[status]}>
        {typeLabels[type]}
      </Badge>
    );
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    
    if (dateFrom) {
      const orderDate = new Date(order.created_at);
      if (orderDate < dateFrom) return false;
    }
    
    if (dateTo) {
      const orderDate = new Date(order.created_at);
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (orderDate > endOfDay) return false;
    }
    
    if (search) {
      const s = search.toLowerCase();
      return order.order_number.toLowerCase().includes(s) ||
             order.email.toLowerCase().includes(s) ||
             `${order.first_name} ${order.last_name}`.toLowerCase().includes(s);
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ieškoti..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Statusas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Visi statusai</SelectItem>
              <SelectItem value="created">Sukurtas</SelectItem>
              <SelectItem value="deposit_paid">Depozitas sumokėtas</SelectItem>
              <SelectItem value="awaiting_balance">Laukia likučio</SelectItem>
              <SelectItem value="balance_paid">Pilnai apmokėtas</SelectItem>
              <SelectItem value="packed">Supakuotas</SelectItem>
              <SelectItem value="shipped">Išsiųstas</SelectItem>
              <SelectItem value="delivered">Pristatytas</SelectItem>
              <SelectItem value="cancelled">Atšauktas</SelectItem>
              <SelectItem value="refunded">Grąžintas</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                {dateFrom || dateTo ? 'Filtruota' : 'Datos'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Nuo</p>
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    locale={lt}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Iki</p>
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    locale={lt}
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}
                  >
                    Išvalyti datas
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <Button onClick={loadOrders} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atnaujinti
        </Button>
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Kraunama...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">
            {orders.length === 0 ? 'Nėra užsakymų' : 'Nerasta užsakymų'}
          </h2>
          <p className="text-muted-foreground">
            {orders.length === 0 
              ? 'Kai klientai pateiks užsakymus, jie bus rodomi čia.' 
              : 'Pabandykite pakeisti filtrus arba paiešką'}
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
              {filteredOrders.map((order) => (
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
                          Prašyti apmokėti likutį ({formatPrice(selectedOrder.balance_total_eur)})
                        </>
                      )}
                    </Button>
                    
                    {balancePaymentUrl && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                        <p className="text-sm text-green-800 font-medium">
                          ✓ Mokėjimo nuoroda sukurta ir išsiųsta klientui!
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(balancePaymentUrl)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Kopijuoti
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(balancePaymentUrl, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Atidaryti
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payments History */}
              {orderPayments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Mokėjimų istorija</h3>
                  <div className="space-y-2">
                    {orderPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getPaymentTypeBadge(payment.type, payment.status)}
                          <span className="text-sm text-muted-foreground">
                            {formatDate(payment.created_at)}
                          </span>
                        </div>
                        <span className={`font-semibold ${payment.type === 'refund' ? 'text-destructive' : 'text-green-600'}`}>
                          {payment.type === 'refund' ? '-' : '+'}{formatPrice(payment.amount_eur)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
                <div>
                  <h3 className="font-semibold mb-2">Klientas</h3>
                  <p className="text-sm">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.email}</p>
                  {selectedOrder.phone && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.phone}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Pristatymo adresas</h3>
                  {selectedOrder.shipping_address_json && (
                    <div className="text-sm text-muted-foreground">
                      <p>{selectedOrder.shipping_address_json.street}</p>
                      <p>{selectedOrder.shipping_address_json.city}, {selectedOrder.shipping_address_json.postal_code}</p>
                      <p>{selectedOrder.shipping_address_json.country}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Prekės</h3>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium">{item.title_snapshot}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.sku_snapshot} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(item.unit_price_eur * item.quantity)}</p>
                        <p className="text-xs text-primary">
                          Depozitas: {formatPrice(item.unit_deposit_eur * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t border-border space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarpinė suma:</span>
                    <span>{formatPrice(selectedOrder.subtotal_eur)}</span>
                  </div>
                  {selectedOrder.discount_eur > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Nuolaida:</span>
                      <span>-{formatPrice(selectedOrder.discount_eur)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pristatymas:</span>
                    <span>{selectedOrder.shipping_eur === 0 ? 'Nemokamas' : formatPrice(selectedOrder.shipping_eur)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Iš viso:</span>
                    <span>{formatPrice(selectedOrder.total_eur)}</span>
                  </div>
                </div>
              </div>

              {/* Shipment Manager */}
              <ShipmentManager
                orderId={selectedOrder.id}
                orderNumber={selectedOrder.order_number}
                shipment={orderShipment}
                onUpdate={refreshOrderDetails}
              />

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Pastabos</h3>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
