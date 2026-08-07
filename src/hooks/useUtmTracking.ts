import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  landing_page?: string;
}

const UTM_STORAGE_KEY = 'ibrix_utm_params';

/**
 * In-memory hold for params seen before the cookie banner is answered.
 *
 * The campaign params arrive on the landing page, but consent is given a few
 * seconds later — by then the visitor may have navigated and the query string
 * is gone. So we always keep them in memory (a JS variable is not "storage"
 * under ePrivacy, so it needs no consent) and only persist to localStorage
 * once analytics consent exists. `flushUtmParams` writes the held values the
 * moment consent is granted.
 */
let pendingUtm: UtmParams | null = null;

function hasAnalyticsConsent(): boolean {
  try {
    const stored = localStorage.getItem('ibrix_cookie_consent');
    if (!stored) return false;
    return JSON.parse(stored)?.state?.consent?.analytics === true;
  } catch {
    return false;
  }
}

function persist(params: UtmParams) {
  try {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify({
      ...params,
      captured_at: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('[UTM] Failed to store UTM params:', e);
  }
}

/** Persist anything held in memory. Call when analytics consent is granted. */
export function flushUtmParams(): void {
  if (pendingUtm && hasAnalyticsConsent()) {
    persist(pendingUtm);
    pendingUtm = null;
  }
}

// Get UTM params from URL and store them
export function captureUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const utmParams: UtmParams = {};
  
  // UTM parameters
  const utm_source = params.get('utm_source');
  const utm_medium = params.get('utm_medium');
  const utm_campaign = params.get('utm_campaign');
  const utm_content = params.get('utm_content');
  const utm_term = params.get('utm_term');
  const gclid = params.get('gclid');
  const fbclid = params.get('fbclid');
  
  if (utm_source) utmParams.utm_source = utm_source;
  if (utm_medium) utmParams.utm_medium = utm_medium;
  if (utm_campaign) utmParams.utm_campaign = utm_campaign;
  if (utm_content) utmParams.utm_content = utm_content;
  if (utm_term) utmParams.utm_term = utm_term;
  if (gclid) utmParams.gclid = gclid;
  if (fbclid) utmParams.fbclid = fbclid;
  
  // Only update if we have new UTM params
  if (Object.keys(utmParams).length > 0) {
    utmParams.landing_page = window.location.pathname;

    if (hasAnalyticsConsent()) {
      persist(utmParams);
    } else {
      // Hold until consent; flushUtmParams() writes it if consent arrives.
      pendingUtm = utmParams;
    }
  }

  return utmParams;
}

// Get stored UTM params
export function getStoredUtmParams(): UtmParams | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[UTM] Failed to get stored UTM params:', e);
  }
  
  return null;
}

// Clear UTM params (after order is placed)
export function clearUtmParams(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(UTM_STORAGE_KEY);
  } catch (e) {
    console.warn('[UTM] Failed to clear UTM params:', e);
  }
}

// Hook to automatically capture UTM params on route changes
export function useUtmTracking() {
  const location = useLocation();
  
  useEffect(() => {
    captureUtmParams();
  }, [location.search]);
  
  return {
    getUtmParams: getStoredUtmParams,
    clearUtmParams,
  };
}

// Generate unique event ID for deduplication
export function generateEventId(prefix: string = 'evt'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}
