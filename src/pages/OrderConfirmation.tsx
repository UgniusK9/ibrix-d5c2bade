import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Package, Clock, Truck, Mail, ArrowRight, Loader2, CreditCard, MapPin, HelpCircle } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { trackPurchaseEvent } from "@/hooks/useAnalytics";
import { format } from "date-fns";
import { lt, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface OrderItem {
  id: string;
  sku_snapshot?: string;
  title_snapshot: string;
  quantity: number;
  unit_price_eur: number;
  unit_deposit_eur: number;
  category: string;
}

interface Payment {
  type: string;
  status: string;
  amount_eur: number;
  created_at: string;
}

interface Shipment {
  id: string;
  tracking_token: string;
  status: string;
  carrier_code: string | null;
  tracking_number: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  subtotal_eur: number;
  discount_eur: number;
  shipping_eur: number;
  total_eur: number;
  deposit_total_eur: number;
  balance_total_eur: number;
  payment_plan: string;
  payment_provider: string | null;
  payment_method_code: string | null;
  paid_at: string | null;
  balance_paid_at: string | null;
  shipping_address_json: Record<string, string>;
  preorder_flag: boolean;
  preorder_eta_weeks_min: number | null;
  preorder_eta_weeks_max: number | null;
  offer_code: string | null;
}

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'en' ? enUS : lt;
  
  // Support multiple param names for backwards compat
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id') || searchParams.get('order');
  const legacyToken = searchParams.get('token');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
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
        totalCents: Math.round(order.deposit_total_eur * 100),
        currency: 'EUR',
        items: items.map(item => ({
          // Catalogue id (SKU), not the order_item row id.
          id: item.sku_snapshot || item.id,
          name: item.title_snapshot,
          price: Math.round(item.unit_price_eur * 100),
          quantity: item.quantity,
        })),
      });
    }
  }, [order, items]);

  useEffect(() => {
    async function loadOrder() {
      // We need either session_id or order_id
      if (!sessionId && !orderId) {
        // Check for legacy tracking token format
        if (legacyToken) {
          setError(t('pgOrderConf.linkExpired'));
        } else {
          setError(t('pgOrderConf.missingInfo'));
        }
        setLoading(false);
        return;
      }

      try {
        // Use the new edge function to get order by session_id or order_id
        const { data, error: fnError } = await supabase.functions.invoke('get-order-by-session', {
          body: { 
            session_id: sessionId,
            order_id: orderId
          }
        });

        if (fnError) {
          console.error('Order fetch error:', fnError);
          setError(t('pgOrderConf.loadFailed'));
          setLoading(false);
          return;
        }

        if (!data?.success || !data?.order) {
          setError(data?.error || t('order.orderNotFound'));
          setLoading(false);
          return;
        }

        setOrder(data.order);
        setItems(data.items || []);
        setShipment(data.shipment);
        setPayments(data.payments || []);
      } catch (err) {
        console.error('Order load error:', err);
        setError(t('pgOrderConf.loadError'));
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, orderId, legacyToken]);

  const hasPreorder = order?.preorder_flag || false;
  const maxEtaWeeks = order?.preorder_eta_weeks_max || 0;

  const getShippingMethodName = (address: Record<string, string>) => {
    if (address?.lockerName) {
      if (address.lockerName.toLowerCase().includes('omniva')) return t('coLocker.carrierLocker', { carrier: 'Omniva' });
      if (address.lockerName.toLowerCase().includes('lp express')) return t('coLocker.carrierLocker', { carrier: 'LP EXPRESS' });
      if (address.lockerName.toLowerCase().includes('dpd')) return t('coLocker.carrierLocker', { carrier: 'DPD' });
      return address.lockerName;
    }
    if (address?.lockerId) return t('checkout.parcelLocker');
    return t('checkout.courier');
  };

  const getPaymentMethodLabel = (provider: string | null, code: string | null) => {
    if (provider === 'paysera') {
      const bankLabels: Record<string, string> = {
        'hanzalt': 'Swedbank',
        'seblt': 'SEB',
        'vb2lt': 'Luminor',
        'cblt': 'Citadele',
        'mblt': 'Šiaulių bankas',
        'revolut': 'Revolut',
      };
      return bankLabels[code || ''] || t('pgOrderConf.bankTransfer');
    }
    if (provider === 'paypal') return 'PayPal';
    if (code === 'apple_pay') return 'Apple Pay';
    if (code === 'google_pay') return 'Google Pay';
    return t('pgOrderConf.cardPayment');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'created': t('pgOrderConf.statusAwaitingPayment'),
      'deposit_paid': t('pgOrderConf.statusDepositPaid'),
      'awaiting_balance': t('pgOrderConf.statusAwaitingBalance'),
      'balance_paid': t('order.fullPaid'),
      'packed': t('order.packed'),
      'shipped': t('order.shipped'),
      'delivered': t('order.delivered'),
    };
    return labels[status] || status;
  };

  const formatPrice = (eur: number) => `${eur.toFixed(2).replace('.', ',')} €`;

  const handleTrackOrder = () => {
    if (order && shipment?.tracking_token) {
      navigate(`/siuntos-sekimas/${order.order_number}?token=${shipment.tracking_token}`);
    }
  };

  const getSupportMailto = () => {
    const subject = encodeURIComponent(t('pgOrderConf.supportSubject', { orderNumber: order?.order_number || '' }));
    const body = encodeURIComponent(t('pgOrderConf.supportBody', { orderNumber: order?.order_number || '' }));
    return `mailto:info@ibrix.lt?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container py-16 max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">{t('pgOrderConf.loadingOrder')}</p>
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
            {error || t('order.orderNotFound')}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t('order.checkLinkOrContact')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <a href="mailto:info@ibrix.lt">{t('pgOrderConf.contactLink')}</a>
            </Button>
            <Button asChild>
              <Link to="/produktai/visi">{t('order.backToStore')}</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const isPaid = order.status !== 'created';
  const paidAmount = order.deposit_total_eur;
  const remainingBalance = order.balance_total_eur;

  return (
    <PageLayout>
      <div className="container py-8 md:py-16 max-w-2xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="bg-success/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="font-heading text-3xl font-bold mb-2">
            {t('order.thankYou')}
          </h1>
          <p className="text-muted-foreground">
            {t('order.prepareAndShip')}
          </p>
        </div>

        {/* Order number and date */}
        <div className="bg-card border border-border rounded-xl p-6 text-center mb-6">
          <p className="text-sm text-muted-foreground mb-1">{t('order.orderNumber')}</p>
          <p className="font-heading text-2xl font-bold text-primary mb-2">
            {order.order_number}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(order.created_at), "yyyy-MM-dd HH:mm", { locale: dateLocale })}
          </p>
          <Badge className="mt-3" variant={isPaid ? "default" : "secondary"}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>

        {/* Pre-order notice */}
        {hasPreorder && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-heading font-semibold">
                Pre-order: ~{maxEtaWeeks} {t('order.preOrderDelivery')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('order.preOrderNotice')}
            </p>
          </div>
        )}

        {/* Payment confirmation */}
        {isPaid && (
          <div className="bg-success/5 border border-success/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-success" />
              <span className="font-heading font-semibold">{t('order.paymentReceived')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('order.confirmationSentTo')} {order.email}
            </p>
          </div>
        )}

        {/* Balance notice for preorder */}
        {hasPreorder && remainingBalance > 0 && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-accent" />
              <span className="font-heading font-semibold">{t('order.whatsNext')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('order.balanceNotice')} ({formatPrice(remainingBalance)}).
            </p>
          </div>
        )}

        {/* Order items */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading font-semibold mb-4">{t('order.orderItems')}</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{item.title_snapshot}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {item.quantity} {t('pgOrderConf.qtyUnit')} × {formatPrice(item.unit_price_eur)}
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

        {/* Totals */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('order.products')}</span>
              <span>{formatPrice(order.subtotal_eur)}</span>
            </div>
            {order.discount_eur > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('cart.discount')} {order.offer_code && `(${order.offer_code})`}
                </span>
                <span className="text-success">-{formatPrice(order.discount_eur)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('cart.shipping')}</span>
              <span>{order.shipping_eur === 0 ? t('common.free') : formatPrice(order.shipping_eur)}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>{t('cart.total')}</span>
              <span className="text-accent">{formatPrice(order.total_eur)}</span>
            </div>
            {hasPreorder && remainingBalance > 0 && (
              <>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('order.paidNow')}</span>
                  <span className="text-success font-medium">{formatPrice(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('order.payLaterAmount')}</span>
                  <span>{formatPrice(remainingBalance)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold">{t('order.shippingInfo')}</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t('order.method')}:</span>{' '}
              <span className="font-medium">{getShippingMethodName(order.shipping_address_json)}</span>
            </p>
            {order.shipping_address_json?.lockerAddress && (
              <p>
                <span className="text-muted-foreground">{t('checkout.address')}:</span>{' '}
                {order.shipping_address_json.lockerAddress}
              </p>
            )}
            {order.shipping_address_json?.street && (
              <p>
                <span className="text-muted-foreground">{t('checkout.address')}:</span>{' '}
                {order.shipping_address_json.street}, {order.shipping_address_json.city} {order.shipping_address_json.postalCode}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">{t('order.recipient')}:</span>{' '}
              {order.first_name} {order.last_name}
            </p>
            {order.phone && (
              <p>
                <span className="text-muted-foreground">{t('checkout.phone')}:</span>{' '}
                {order.phone}
              </p>
            )}
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold">{t('order.paymentInfo')}</h2>
          </div>
          <p className="text-sm">
            <span className="text-muted-foreground">{t('order.method')}:</span>{' '}
            <span className="font-medium">{getPaymentMethodLabel(order.payment_provider, order.payment_method_code)}</span>
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          {shipment?.tracking_token && (
            <Button onClick={handleTrackOrder} variant="outline" size="lg">
              <Truck className="w-4 h-4 mr-2" />
              {t('pgOrderConf.trackShipment')}
            </Button>
          )}
          <Button asChild size="lg">
            <Link to="/produktai/visi">
              {t('order.continueShoppingSingle')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Support button */}
        <div className="text-center">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <a href={getSupportMailto()}>
              <HelpCircle className="w-4 h-4 mr-2" />
              {t('order.issueContact')}
            </a>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
