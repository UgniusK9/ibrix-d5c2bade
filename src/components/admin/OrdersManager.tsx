import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, RefreshCw, CreditCard, DollarSign, Copy, ExternalLink, Search, Filter, Truck, Box, MessageSquare, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderShipment, setOrderShipment] = useState<Shipment | null>(null);
  const [orderPayments, setOrderPayments] = useState<Payment[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [requestingBalance, setRequestingBalance] = useState(false);
  const [balancePaymentUrl, setBalancePaymentUrl] = useState<string | null>(null);
  const [balanceMessage, setBalanceMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);
  
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

  const exportToCSV = () => {
    const headers = [
      t('admOrders.ordCsvNo'),
      t('admCommon.statusLabel'),
      t('admCommon.firstName'),
      t('admCommon.lastName'),
      t('admCommon.email'),
      t('admCommon.phone'),
      t('admOrders.ordCsvTotal'),
      t('admOrders.ordCsvDeposit'),
      t('admOrders.ordCsvBalance'),
      t('admOrders.ordCsvDiscount'),
      t('admOrders.ordCsvShipping'),
      t('products.preOrderLabel'),
      t('admCommon.created'),
      t('admAnalytics.dashDepositPaid'),
      t('admOrders.ordCsvBalancePaid')
    ];
    
    const rows = filteredOrders.map(order => [
      order.order_number,
      order.status,
      order.first_name,
      order.last_name,
      order.email,
      order.phone || '',
      order.total_eur.toFixed(2),
      order.deposit_total_eur.toFixed(2),
      order.balance_total_eur.toFixed(2),
      order.discount_eur.toFixed(2),
      order.shipping_eur.toFixed(2),
      order.preorder_flag ? t('common.yes') : t('common.no'),
      new Date(order.created_at).toISOString().split('T')[0],
      order.paid_at ? new Date(order.paid_at).toISOString().split('T')[0] : '',
      order.balance_paid_at ? new Date(order.balance_paid_at).toISOString().split('T')[0] : ''
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${t('admOrders.ordCsvFile')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success(t('admOrders.ordCsvDone'));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
    setOrderShipment(null);
    setOrderItems([]);
    setBalanceMessage('');
    setShowMessageInput(false);
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
        body: { 
          orderId: selectedOrder.id,
          customMessage: balanceMessage.trim() || null
        }
      });

      if (error) throw error;
      
      if (data?.success && data?.paymentUrl) {
        setBalancePaymentUrl(data.paymentUrl);
        toast.success(t('admOrders.ordPayLinkDone'));
        await refreshOrderDetails();
        await loadOrders();
      } else {
        toast.error(data?.error || t('admOrders.ordPayLinkError'));
      }
    } catch (e: any) {
      console.error('Failed to request balance payment:', e);
      toast.error(e.message || t('admOrders.ordPayLinkFail'));
    } finally {
      setRequestingBalance(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('admCommon.copied'));
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig: Record<OrderStatus, { label: string; className: string; icon: React.ReactNode }> = {
      'created': { 
        label: t('admOrders.ordCreated'), 
        className: 'bg-muted text-muted-foreground',
        icon: <AlertCircle className="w-3 h-3" />
      },
      'deposit_paid': { 
        label: t('admAnalytics.dashDepositPaid'), 
        className: 'bg-green-500/10 text-green-600 border-green-500/30',
        icon: <CreditCard className="w-3 h-3" />
      },
      'awaiting_balance': { 
        label: t('admOrders.ordAwaitingBalance'), 
        className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
        icon: <Clock className="w-3 h-3" />
      },
      'balance_paid': { 
        label: t('admAnalytics.dashFullyPaid'), 
        className: 'bg-green-500/10 text-green-600 border-green-500/30',
        icon: <CheckCircle2 className="w-3 h-3" />
      },
      'packed': { 
        label: t('admOrders.ordPacked'), 
        className: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
        icon: <Box className="w-3 h-3" />
      },
      'shipped': { 
        label: t('admOrders.ordShipped'), 
        className: 'bg-primary/10 text-primary border-primary/30',
        icon: <Truck className="w-3 h-3" />
      },
      'delivered': { 
        label: t('admOrders.ordDelivered'), 
        className: 'bg-green-500/10 text-green-600 border-green-500/30',
        icon: <CheckCircle2 className="w-3 h-3" />
      },
      'cancelled': { 
        label: t('admOrders.ordCancelled'), 
        className: 'bg-destructive/10 text-destructive border-destructive/30',
        icon: <XCircle className="w-3 h-3" />
      },
      'refunded': { 
        label: t('admOrders.ordRefunded'), 
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
      'deposit': t('admOrders.ordPayDeposit'),
      'balance': t('admOrders.ordPayBalance'),
      'refund': t('admOrders.ordPayRefund'),
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
              placeholder={t('admCommon.searchPh')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('admCommon.statusLabel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('products.allStatuses')}</SelectItem>
              <SelectItem value="created">{t('admOrders.ordCreated')}</SelectItem>
              <SelectItem value="deposit_paid">{t('admAnalytics.dashDepositPaid')}</SelectItem>
              <SelectItem value="awaiting_balance">{t('admOrders.ordAwaitingBalance')}</SelectItem>
              <SelectItem value="balance_paid">{t('admAnalytics.dashFullyPaid')}</SelectItem>
              <SelectItem value="packed">{t('admOrders.ordPacked')}</SelectItem>
              <SelectItem value="shipped">{t('admOrders.ordShipped')}</SelectItem>
              <SelectItem value="delivered">{t('admOrders.ordDelivered')}</SelectItem>
              <SelectItem value="cancelled">{t('admOrders.ordCancelled')}</SelectItem>
              <SelectItem value="refunded">{t('admOrders.ordRefunded')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                {dateFrom || dateTo ? t('admOrders.ordFiltered') : t('admOrders.ordDates')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">{t('admOrders.ordFrom')}</p>
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    locale={lt}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">{t('admOrders.ordTo')}</p>
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
                    {t('admOrders.ordClearDates')}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t('admOrders.ordExportCsv')}
          </Button>
          <Button onClick={loadOrders} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admCommon.refresh')}
          </Button>
        </div>
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">{t('common.loading')}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">
            {orders.length === 0 ? t('admOrders.ordEmpty') : t('admOrders.ordNoResults')}
          </h2>
          <p className="text-muted-foreground">
            {orders.length === 0 
              ? t('admOrders.ordEmptyHint') 
              : t('admOrders.ordTryFilters')}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admOrders.ordOrder')}</TableHead>
                <TableHead>{t('admOrders.ordCustomer')}</TableHead>
                <TableHead>{t('admCommon.statusLabel')}</TableHead>
                <TableHead>{t('admOrders.ordDepBal')}</TableHead>
                <TableHead>{t('admCommon.date')}</TableHead>
                <TableHead className="text-right">{t('common.amount')}</TableHead>
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
              {t('admOrders.ordTitle', { num: selectedOrder?.order_number })}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{t('admUsers.inqStatusLabel')}</span>
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
                  {t('admOrders.ordPaymentInfo')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">{t('admOrders.ordPayDeposit')}</span>
                    <p className="font-semibold text-green-600">{formatPrice(selectedOrder.deposit_total_eur)}</p>
                    {selectedOrder.paid_at && (
                      <p className="text-xs text-muted-foreground">
                        {t('admOrders.ordPaidAt', { date: formatDate(selectedOrder.paid_at) })}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t('admOrders.ordPayBalance')}</span>
                    <p className={`font-semibold ${selectedOrder.balance_paid_at ? 'text-green-600' : 'text-yellow-600'}`}>
                      {formatPrice(selectedOrder.balance_total_eur)}
                    </p>
                    {selectedOrder.balance_paid_at ? (
                      <p className="text-xs text-green-600">
                        ✓ {t('admOrders.ordPaidAt', { date: formatDate(selectedOrder.balance_paid_at) })}
                      </p>
                    ) : (
                      <p className="text-xs text-yellow-600">
                        {t('admOrders.ordUnpaid')}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Request Balance Button */}
                {(selectedOrder.status === 'deposit_paid' || selectedOrder.status === 'awaiting_balance') && !selectedOrder.balance_paid_at && (
                  <div className="mt-4 space-y-3">
                    {!showMessageInput ? (
                      <Button 
                        size="sm" 
                        className="w-full" 
                        onClick={() => setShowMessageInput(true)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {t('admOrders.ordRequestBalance', { amount: formatPrice(selectedOrder.balance_total_eur) })}
                      </Button>
                    ) : (
                      <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
                        <div>
                          <p className="text-sm font-medium mb-2">{t('admOrders.ordMsgLabel')}</p>
                          <Textarea
                            value={balanceMessage}
                            onChange={(e) => setBalanceMessage(e.target.value)}
                            placeholder={t('admOrders.ordMsgPh')}
                            rows={3}
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('admOrders.ordMsgHint')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setShowMessageInput(false);
                              setBalanceMessage('');
                            }}
                          >
                            {t('common.cancel')}
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={requestBalancePayment}
                            disabled={requestingBalance}
                          >
                            {requestingBalance ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                {t('common.sending')}
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                {t('admOrders.ordSendRequest')}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {balancePaymentUrl && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
                        <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                          {t('admOrders.ordLinkSent')}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(balancePaymentUrl)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            {t('admOrders.ordCopy')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(balancePaymentUrl, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            {t('admCommon.open')}
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
                  <h3 className="font-semibold mb-3">{t('admOrders.ordPayHistory')}</h3>
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
                  <h3 className="font-semibold mb-2">{t('admOrders.ordCustomer')}</h3>
                  <p className="text-sm">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.email}</p>
                  {selectedOrder.phone && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.phone}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t('admOrders.ordShipAddress')}</h3>
                  {selectedOrder.shipping_address_json && (
                    <div className="text-sm text-muted-foreground">
                      {selectedOrder.shipping_address_json.lockerName ? (
                        <>
                          <p className="font-medium">{selectedOrder.shipping_address_json.lockerName}</p>
                          <p>{selectedOrder.shipping_address_json.lockerAddress}</p>
                          {selectedOrder.shipping_address_json.lockerCity && (
                            <p>{selectedOrder.shipping_address_json.lockerCity}, {selectedOrder.shipping_address_json.lockerPostalCode}</p>
                          )}
                          {selectedOrder.shipping_address_json.recipientPhone && (
                            <p>Tel: {selectedOrder.shipping_address_json.recipientPhone}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p>{selectedOrder.shipping_address_json.street}</p>
                          <p>{selectedOrder.shipping_address_json.city}, {selectedOrder.shipping_address_json.postalCode || selectedOrder.shipping_address_json.postal_code}</p>
                          {selectedOrder.shipping_address_json.country && (
                            <p>{selectedOrder.shipping_address_json.country}</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">{t('admCommon.items')}</h3>
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
                          {t('admOrders.ordPayDeposit')}: {formatPrice(item.unit_deposit_eur * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t border-border space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cart.subtotal')}:</span>
                    <span>{formatPrice(selectedOrder.subtotal_eur)}</span>
                  </div>
                  {selectedOrder.discount_eur > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t('cart.discount')}:</span>
                      <span>-{formatPrice(selectedOrder.discount_eur)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cart.shipping')}:</span>
                    <span>{selectedOrder.shipping_eur === 0 ? t('common.free') : formatPrice(selectedOrder.shipping_eur)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>{t('cart.total')}:</span>
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
                  <h3 className="font-semibold mb-2">{t('admOrders.ordNotes')}</h3>
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
