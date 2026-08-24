import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { captureUtmParams, flushUtmParams } from '@/hooks/useUtmTracking';
import { useHasConsent } from '@/stores/cookieConsentStore';

export function PageViewTracker() {
  const location = useLocation();
  const { trackPageView } = useAnalytics();
  const hasAnalyticsConsent = useHasConsent('analytics');

  // Capture campaign params before anything else. Runs on every navigation
  // because a tagged link can land on any route, and re-running is cheap —
  // captureUtmParams only overwrites when the URL actually carries params.
  useEffect(() => {
    captureUtmParams();
  }, [location.search]);

  // Params seen before the cookie banner was answered are held in memory;
  // persist them the moment analytics consent is granted.
  useEffect(() => {
    if (hasAnalyticsConsent) flushUtmParams();
  }, [hasAnalyticsConsent]);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location, trackPageView]);

  return null;
}
