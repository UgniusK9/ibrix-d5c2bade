import { useHasConsent } from '@/stores/cookieConsentStore';
import { generateEventId, getStoredUtmParams } from './useUtmTracking';
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
  eventId?: string;
}

interface CheckoutData {
  items: ProductData[];
  totalCents: number;
  currency?: string;
  step?: string;
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

// Log event to first-party DB (always, regardless of consent for server-side analytics)
async function logEventToDb(
  name: string, 
  properties: Record<string, any>,
  eventId: string,
  source: 'client' | 'server' = 'client'
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    await supabase.from('events').insert({
      name,
      event_id: eventId,
      source,
      user_id: session?.user?.id || null,
      properties: {
        ...properties,
        ...getStoredUtmParams(),
      },
    });
  } catch (e) {
    console.warn('[Analytics] Failed to log event to DB:', e);
  }
}

// ============================================
// Tracking functions with deduplication
// ============================================

export function trackViewContentEvent(product: ProductData) {
  const { analytics, marketing } = getConsentStatus();
  const priceValue = product.price / 100;
  const eventId = generateEventId('view');

  // Always log to first-party DB
  logEventToDb('view_item', {
    product_id: product.id,
    product_name: product.name,
    price_eur: priceValue,
    category: product.category,
  }, eventId);

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
}

export function trackAddToCartEvent(product: ProductData) {
  const { analytics, marketing } = getConsentStatus();
  const priceValue = product.price / 100;
  const eventId = generateEventId('atc');

  // Always log to first-party DB
  logEventToDb('add_to_cart', {
    product_id: product.id,
    product_name: product.name,
    price_eur: priceValue,
    quantity: product.quantity || 1,
    category: product.category,
  }, eventId);

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
}

export function trackBeginCheckoutEvent(data: CheckoutData) {
  const { analytics, marketing } = getConsentStatus();
  const totalValue = data.totalCents / 100;
  const currency = data.currency || 'EUR';
  const eventId = generateEventId('checkout');

  // Always log to first-party DB
  logEventToDb('begin_checkout', {
    total_eur: totalValue,
    item_count: data.items.length,
    items: data.items.map(i => ({ id: i.id, name: i.name, qty: i.quantity })),
  }, eventId);

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
}

export function trackAddPaymentInfoEvent(data: CheckoutData) {
  const { analytics, marketing } = getConsentStatus();
  const totalValue = data.totalCents / 100;
  const currency = data.currency || 'EUR';
  const eventId = generateEventId('pay');

  // Always log to first-party DB
  logEventToDb('add_payment_info', {
    total_eur: totalValue,
    item_count: data.items.length,
  }, eventId);

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
}

// Client-side purchase tracking (for immediate feedback)
// Note: Server-side also tracks this for accuracy
export function trackPurchaseEvent(data: PurchaseData) {
  const { analytics, marketing } = getConsentStatus();
  const totalValue = data.totalCents / 100;
  const currency = data.currency || 'EUR';
  const eventId = data.eventId || generateEventId('purchase');

  // Note: Don't log to DB here - server-side webhook handles canonical purchase event

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

  // Meta Pixel with event_id for server-side deduplication
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
}

// Track signup event
export function trackSignupEvent(method: string = 'email') {
  const { analytics, marketing } = getConsentStatus();
  const eventId = generateEventId('signup');

  logEventToDb('sign_up', { method }, eventId);

  if (analytics && window.gtag) {
    window.gtag('event', 'sign_up', { method });
    console.log('[Analytics] GA SignUp:', method);
  }

  if (marketing && window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      content_name: 'User Registration',
      status: 'complete',
    }, { eventID: eventId });
    console.log('[Analytics] Meta CompleteRegistration:', method);
  }
}

// Track login event
export function trackLoginEvent(method: string = 'email') {
  const { analytics, marketing } = getConsentStatus();
  const eventId = generateEventId('login');

  logEventToDb('login', { method }, eventId);

  if (analytics && window.gtag) {
    window.gtag('event', 'login', { method });
    console.log('[Analytics] GA Login:', method);
  }
}

// ============================================
// React hook version
// ============================================
export function useEnhancedAnalytics() {
  const hasAnalyticsConsent = useHasConsent('analytics');
  const hasMarketingConsent = useHasConsent('marketing');

  const trackPageView = (path: string, title?: string) => {
    const eventId = generateEventId('pv');
    
    // Always log to first-party DB
    logEventToDb('page_view', { path, title: title || document.title }, eventId);

    if (hasAnalyticsConsent && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      });
      console.log('[Analytics] GA PageView:', path);
    }

    if (hasMarketingConsent && window.fbq) {
      window.fbq('track', 'PageView', {}, { eventID: eventId });
      console.log('[Analytics] Meta PageView');
    }
  };

  return {
    trackPageView,
    trackViewContent: trackViewContentEvent,
    trackAddToCart: trackAddToCartEvent,
    trackBeginCheckout: trackBeginCheckoutEvent,
    trackAddPaymentInfo: trackAddPaymentInfoEvent,
    trackPurchase: trackPurchaseEvent,
    trackSignup: trackSignupEvent,
    trackLogin: trackLoginEvent,
  };
}
