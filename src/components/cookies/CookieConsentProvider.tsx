import { CookieBanner } from './CookieBanner';
import { CookieSettingsModal } from './CookieSettingsModal';
import { useHasConsent, useCookieConsentStore } from '@/stores/cookieConsentStore';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsConfig {
  gaId: string | null;
  metaPixelId: string | null;
}

// Declare global types for analytics
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

// Script injection helper
const injectScript = (src: string, id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

// Google Analytics loader
const loadGoogleAnalytics = async (gaId: string) => {
  try {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', gaId, {
      anonymize_ip: true, // GDPR compliance
      cookie_flags: 'SameSite=Lax;Secure',
    });
    
    // Load the GA script
    await injectScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`, 'ga-script');
    console.log('[Cookies] Google Analytics loaded:', gaId);
  } catch (error) {
    console.error('[Cookies] Failed to load Google Analytics:', error);
  }
};

// Meta Pixel loader
const loadMetaPixel = (pixelId: string) => {
  try {
    // Meta Pixel base code
    const f = window;
    const b = document;
    const e = 'script';
    
    if (f.fbq) return;
    
    const n: any = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    t.id = 'meta-pixel-script';
    
    const s = b.getElementsByTagName(e)[0];
    if (s && s.parentNode) {
      s.parentNode.insertBefore(t, s);
    }
    
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
    
    console.log('[Cookies] Meta Pixel loaded:', pixelId);
  } catch (error) {
    console.error('[Cookies] Failed to load Meta Pixel:', error);
  }
};

// Analytics script loader component
function AnalyticsScripts() {
  const hasAnalyticsConsent = useHasConsent('analytics');
  const hasMarketingConsent = useHasConsent('marketing');
  const consent = useCookieConsentStore((state) => state.consent);
  const [config, setConfig] = useState<AnalyticsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch analytics config from edge function
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('analytics-config');
        if (error) throw error;
        setConfig(data);
      } catch (error) {
        console.error('[Cookies] Failed to fetch analytics config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConfig();
  }, []);
  
  // Load Google Analytics when consent is given
  useEffect(() => {
    if (isLoading || !config?.gaId || !consent) return;
    
    if (hasAnalyticsConsent) {
      loadGoogleAnalytics(config.gaId);
    }
  }, [hasAnalyticsConsent, config, consent, isLoading]);
  
  // Load Meta Pixel when consent is given
  useEffect(() => {
    if (isLoading || !config?.metaPixelId || !consent) return;
    
    if (hasMarketingConsent) {
      loadMetaPixel(config.metaPixelId);
    }
  }, [hasMarketingConsent, config, consent, isLoading]);
  
  return null;
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AnalyticsScripts />
      <CookieBanner />
      <CookieSettingsModal />
    </>
  );
}
