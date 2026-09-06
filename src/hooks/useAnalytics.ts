import { useHasConsent } from '@/stores/cookieConsentStore';
import { supabase } from '@/integrations/supabase/client';

interface ProductData {
  id: string;
  name: string;
  price: number; // in cents
  currency?: string;
  quantity?: number;
  category?: string;
}

interface PurchaseData {
  orderId: string;
  orderNumber: string;
  items: ProductData[];
  totalCents: number;
  currency?: string;
}

interface CheckoutData {
  items: ProductData[];
  totalCents: number;
  currency?: string;
  step?: string;
}

// Generate unique event ID for deduplication
function generateEventId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Get FBP and FBC cookies for Meta attribution
function getMetaCookies(): { fbp?: string; fbc?: string } {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return {
    fbp: cookies['_fbp'],
    fbc: cookies['_fbc'],
  };
}

// Get client user agent and URL for server events
function getClientInfo() {
  return {
    userAgent: navigator.userAgent,
    eventSourceUrl: window.location.href,
  };
}

// Get consent status from store (for non-React contexts)
function getConsentStatus() {
  try {
    const stored = localStorage.getItem('ibrix_cookie_consent');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        analytics: parsed?.state?.consent?.analytics ?? false,
        marketing: parsed?.state?.consent?.marketing ?? false,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { analytics: false, marketing: false };
}

// TikTok Pixel helper. TikTok uses its own event names (notably
// CompletePayment rather than Purchase) and a flat contents[] shape.
// Gated on marketing consent, same as Meta.
function trackTikTok(event: string, params: Record<string, unknown>) {
  const w = window as unknown as { ttq?: { track: (e: string, p: unknown) => void } };
  if (!w.ttq) return;
  w.ttq.track(event, params);
  console.log('[Analytics] TikTok', event, params);
}

function ttContents(items: ProductData[]) {
  return items.map((item) => ({
    content_id: item.id,
    content_type: 'product',
    content_name: item.name,
    quantity: item.quantity || 1,
    price: item.price / 100,
  }));
}

// Store event for potential server-side sending
function storeEventForServer(eventName: string, eventId: string, data: any) {
  try {
    const events = JSON.parse(sessionStorage.getItem('pending_server_events') || '[]');
    events.push({
      name: eventName,
      eventId,
      data,
      timestamp: Date.now(),
      ...getMetaCookies(),
      ...getClientInfo(),
    });
    // Keep only last 10 events
    sessionStorage.setItem('pending_server_events', JSON.stringify(events.slice(-10)));
  } catch (e) {
    console.warn('[Analytics] Failed to store event for server:', e);
  }
}

// First-party event log. The admin dashboard's funnel and top-products list read
// straight from this table, so without these inserts it can only ever show zeros.
// Fire-and-forget: analytics must never block or break a purchase.
function logEventToDb(name: string, eventId: string, properties: Record<string, unknown>) {
  void (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const { error } = await supabase.from('events').insert({
        name,
        event_id: eventId,
        source: 'client',
        user_id: data.session?.user?.id ?? null,
        properties: properties as never,
      });
      if (error) console.warn('[Analytics] events insert rejected:', error.message);
    } catch (e) {
      console.warn('[Analytics] events insert failed:', e);
    }
  })();
}

// ============================================
// Standalone tracking functions (for stores/non-React code)
// ============================================

export function trackViewContentEvent(product: ProductData): string {
  const { analytics, marketing } = getConsentStatus();
  const priceValue = product.price / 100;
  const eventId = generateEventId();

  // Google Analytics - view_item
  if (analytics && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: product.currency || 'EUR',
      value: priceValue,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: priceValue,
        quantity: 1,
        item_category: product.category,
      }],
    });
    console.log('[Analytics] GA ViewItem:', product.name);
  }

  // Meta Pixel - ViewContent with event_id for deduplication
  if (marketing && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      content_category: product.category,
      value: priceValue,
      currency: product.currency || 'EUR',
    }, { eventID: eventId });
    console.log('[Analytics] Meta ViewContent:', product.name, 'eventId:', eventId);
  }

  if (marketing) {
    trackTikTok('ViewContent', {
      contents: ttContents([product]),
      value: priceValue,
      currency: product.currency || 'EUR',
    });
  }

  storeEventForServer('ViewContent', eventId, { product, priceValue });
  logEventToDb('view_item', eventId, {
    product_id: product.id,
    product_name: product.name,
    price: priceValue,
    currency: product.currency || 'EUR',
    category: product.category,
  });
  return eventId;
}

export function trackAddToCartEvent(product: ProductData): string {
  const { analytics, marketing } = getConsentStatus();
  const priceValue = product.price / 100;
  const eventId = generateEventId();

  // Google Analytics
  if (analytics && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: product.currency || 'EUR',
      value: priceValue,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: priceValue,
        quantity: product.quantity || 1,
        item_category: product.category,
      }],
    });
    console.log('[Analytics] GA AddToCart:', product.name);
  }

  // Meta Pixel with event_id
  if (marketing && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      content_category: product.category,
      value: priceValue,
      currency: product.currency || 'EUR',
    }, { eventID: eventId });
    console.log('[Analytics] Meta AddToCart:', product.name, 'eventId:', eventId);
  }

  if (marketing) {
    trackTikTok('AddToCart', {
      contents: ttContents([product]),
      value: priceValue * (product.quantity || 1),
      currency: product.currency || 'EUR',
    });
  }

  storeEventForServer('AddToCart', eventId, { product, priceValue });
  logEventToDb('add_to_cart', eventId, {
    product_id: product.id,
    product_name: product.name,
    price: priceValue,
    quantity: product.quantity || 1,
    currency: product.currency || 'EUR',
    category: product.category,
  });
  return eventId;
}

export function trackBeginCheckoutEvent(data: CheckoutData): string {
  const { analytics, marketing } = getConsentStatus();
  const totalValue = data.totalCents / 100;
  const currency = data.currency || 'EUR';
  const eventId = generateEventId();

  // Google Analytics - begin_checkout
  if (analytics && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency,
      value: totalValue,
      items: data.items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price / 100,
        quantity: item.quantity || 1,
        item_category: item.category,
      })),
    });
    console.log('[Analytics] GA BeginCheckout:', totalValue);
  }

  // Meta Pixel - InitiateCheckout with event_id
  if (marketing && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: data.items.map(item => item.id),
      content_type: 'product',
      value: totalValue,
      currency,
      num_items: data.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    }, { eventID: eventId });
    console.log('[Analytics] Meta InitiateCheckout:', totalValue, 'eventId:', eventId);
  }

  if (marketing) {
    trackTikTok('InitiateCheckout', {
      contents: ttContents(data.items),
      value: totalValue,
      currency,
    });
  }

  storeEventForServer('InitiateCheckout', eventId, { ...data, totalValue });
  logEventToDb('begin_checkout', eventId, {
    value: totalValue,
    currency,
    items: data.items.map(i => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price / 100,
      quantity: i.quantity || 1,
    })),
  });
  return eventId;
}

export function trackAddPaymentInfoEvent(data: CheckoutData): string {
  const { analytics, marketing } = getConsentStatus();
  const totalValue = data.totalCents / 100;
  const currency = data.currency || 'EUR';
  const eventId = generateEventId();

  // Google Analytics - add_payment_info
  if (analytics && window.gtag) {
    window.gtag('event', 'add_payment_info', {
      currency,
      value: totalValue,
      items: data.items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price / 100,
        quantity: item.quantity || 1,
      })),
    });
    console.log('[Analytics] GA AddPaymentInfo:', totalValue);
  }

  // Meta Pixel - AddPaymentInfo with event_id
  if (marketing && window.fbq) {
    window.fbq('track', 'AddPaymentInfo', {
      content_ids: data.items.map(item => item.id),
      content_type: 'product',
      value: totalValue,
      currency,
    }, { eventID: eventId });
    console.log('[Analytics] Meta AddPaymentInfo:', totalValue, 'eventId:', eventId);
  }

  if (marketing) {
    trackTikTok('AddPaymentInfo', {
      contents: ttContents(data.items),
      value: totalValue,
      currency,
    });
  }

  storeEventForServer('AddPaymentInfo', eventId, { ...data, totalValue });
  logEventToDb('add_payment_info', eventId, {
    value: totalValue,
    currency,
    items: data.items.map(i => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price / 100,
      quantity: i.quantity || 1,
    })),
  });
  return eventId;
}

export function trackPurchaseEvent(data: PurchaseData): string {
  const { analytics, marketing } = getConsentStatus();
  const totalValue = data.totalCents / 100;
  const currency = data.currency || 'EUR';
  const eventId = generateEventId();

  // Google Analytics
  if (analytics && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: data.orderNumber,
      value: totalValue,
      currency,
      items: data.items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price / 100,
        quantity: item.quantity || 1,
      })),
    });
    console.log('[Analytics] GA Purchase:', data.orderNumber, totalValue);
  }

  // Meta Pixel with event_id for server deduplication
  if (marketing && window.fbq) {
    window.fbq('track', 'Purchase', {
      content_ids: data.items.map(item => item.id),
      content_type: 'product',
      value: totalValue,
      currency,
      num_items: data.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    }, { eventID: eventId });
    console.log('[Analytics] Meta Purchase:', data.orderNumber, totalValue, 'eventId:', eventId);
  }

  // TikTok's purchase event is CompletePayment, not Purchase.
  if (marketing) {
    trackTikTok('CompletePayment', {
      contents: ttContents(data.items),
      value: totalValue,
      currency,
    });
  }

  // Store for server-side sending (will be picked up by webhook)
  storeEventForServer('Purchase', eventId, { ...data, totalValue });
  logEventToDb('purchase', eventId, {
    order_id: data.orderId,
    order_number: data.orderNumber,
    value: totalValue,
    currency,
    items: data.items.map(i => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price / 100,
      quantity: i.quantity || 1,
    })),
  });
  return eventId;
}

export function trackRefundEvent(data: { orderId: string; orderNumber: string; amountCents: number; currency?: string }): string {
  const { analytics, marketing } = getConsentStatus();
  const refundValue = data.amountCents / 100;
  const currency = data.currency || 'EUR';
  const eventId = generateEventId();

  // Google Analytics - refund
  if (analytics && window.gtag) {
    window.gtag('event', 'refund', {
      transaction_id: data.orderNumber,
      value: refundValue,
      currency,
    });
    console.log('[Analytics] GA Refund:', data.orderNumber, refundValue);
  }

  return eventId;
}

// ============================================
// React hook version
// ============================================
export function useAnalytics() {
  const hasAnalyticsConsent = useHasConsent('analytics');
  const hasMarketingConsent = useHasConsent('marketing');

  const trackPageView = (path: string, title?: string): string => {
    const eventId = generateEventId();
    
    if (hasAnalyticsConsent && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      });
      console.log('[Analytics] GA PageView:', path);
    }

    if (hasMarketingConsent && window.fbq) {
      window.fbq('track', 'PageView', {}, { eventID: eventId });
      console.log('[Analytics] Meta PageView, eventId:', eventId);
    }

    // SPA route change — ttq.page() only fires once on initial load.
    const w = window as unknown as { ttq?: { page: () => void } };
    if (hasMarketingConsent && w.ttq) {
      w.ttq.page();
      console.log('[Analytics] TikTok PageView:', path);
    }

    return eventId;
  };

  const trackViewContent = (product: ProductData) => trackViewContentEvent(product);
  const trackAddToCart = (product: ProductData) => trackAddToCartEvent(product);
  const trackBeginCheckout = (data: CheckoutData) => trackBeginCheckoutEvent(data);
  const trackAddPaymentInfo = (data: CheckoutData) => trackAddPaymentInfoEvent(data);
  const trackPurchase = (data: PurchaseData) => trackPurchaseEvent(data);
  const trackRefund = (data: { orderId: string; orderNumber: string; amountCents: number; currency?: string }) => trackRefundEvent(data);

  return {
    trackPageView,
    trackViewContent,
    trackAddToCart,
    trackBeginCheckout,
    trackAddPaymentInfo,
    trackPurchase,
    trackRefund,
  };
}
