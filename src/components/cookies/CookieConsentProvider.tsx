import { CookieBanner } from './CookieBanner';
import { CookieSettingsModal } from './CookieSettingsModal';
import { useHasConsent } from '@/stores/cookieConsentStore';
import { useEffect } from 'react';

// Script injection helper
const injectScript = (src: string, id: string) => {
  if (document.getElementById(id)) return;
  
  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
};

// Analytics script loader (placeholder - replace with actual IDs when needed)
function AnalyticsScripts() {
  const hasAnalyticsConsent = useHasConsent('analytics');
  const hasMarketingConsent = useHasConsent('marketing');
  
  useEffect(() => {
    // Only load analytics scripts if user consented
    if (hasAnalyticsConsent) {
      // Example: Google Analytics
      // Uncomment and replace GA_MEASUREMENT_ID when ready
      /*
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID');
      injectScript('https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID', 'ga-script');
      */
      console.log('[Cookies] Analytics consent given - scripts would load here');
    }
  }, [hasAnalyticsConsent]);
  
  useEffect(() => {
    // Only load marketing scripts if user consented
    if (hasMarketingConsent) {
      // Example: Meta Pixel
      // Uncomment and replace PIXEL_ID when ready
      /*
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', 'PIXEL_ID');
      fbq('track', 'PageView');
      */
      console.log('[Cookies] Marketing consent given - scripts would load here');
    }
  }, [hasMarketingConsent]);
  
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
