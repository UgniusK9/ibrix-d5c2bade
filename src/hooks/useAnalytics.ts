import { useHasConsent } from '@/stores/cookieConsentStore';

interface ProductData {
  id: string;
  name: string;
  price: number; // in cents
  currency?: string;
  quantity?: number;
}

interface PurchaseData {
  orderId: string;
  orderNumber: string;
  items: ProductData[];
  totalCents: number;
  currency?: string;
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

// Standalone tracking functions (for use in stores/non-React code)
export function trackAddToCartEvent(product: ProductData) {
  const { analytics, marketing } = getConsentStatus();
  const priceValue = product.price / 100;

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
      }],
    });
    console.log('[Analytics] GA AddToCart:', product.name);
  }

  // Meta Pixel
  if (marketing && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: priceValue,
      currency: product.currency || 'EUR',
    });
    console.log('[Analytics] Meta AddToCart:', product.name);
  }
}

export function trackPurchaseEvent(data: PurchaseData) {
  const { analytics, marketing } = getConsentStatus();
  const totalValue = data.totalCents / 100;
  const currency = data.currency || 'EUR';

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

  // Meta Pixel
  if (marketing && window.fbq) {
    window.fbq('track', 'Purchase', {
      content_ids: data.items.map(item => item.id),
      content_type: 'product',
      value: totalValue,
      currency,
      num_items: data.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    });
    console.log('[Analytics] Meta Purchase:', data.orderNumber, totalValue);
  }
}

// React hook version
export function useAnalytics() {
  const hasAnalyticsConsent = useHasConsent('analytics');
  const hasMarketingConsent = useHasConsent('marketing');

  const trackPageView = (path: string, title?: string) => {
    if (hasAnalyticsConsent && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      });
      console.log('[Analytics] GA PageView:', path);
    }

    if (hasMarketingConsent && window.fbq) {
      window.fbq('track', 'PageView');
      console.log('[Analytics] Meta PageView');
    }
  };

  const trackAddToCart = (product: ProductData) => {
    trackAddToCartEvent(product);
  };

  const trackPurchase = (data: PurchaseData) => {
    trackPurchaseEvent(data);
  };

  return {
    trackPageView,
    trackAddToCart,
    trackPurchase,
  };
}
