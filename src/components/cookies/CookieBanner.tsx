import { useTranslation } from "react-i18next";
import { useCookieConsentStore } from '@/stores/cookieConsentStore';
import { Button } from '@/components/ui/button';
import { Cookie, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CookieBanner() {
  const { t } = useTranslation();
  const { consent, hasInteracted, acceptAll, rejectNonEssential, openModal } = useCookieConsentStore();
  
  // Don't show if user has already interacted
  const shouldShow = !hasInteracted && !consent;
  
  if (!shouldShow) return null;
  
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6",
        "animate-in slide-in-from-bottom-full duration-500"
      )}
    >
      <div className="container max-w-4xl">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Cookie className="h-5 w-5 text-accent" />
            </div>
            <h2 className="font-heading font-semibold text-lg text-foreground">
              {t('cookieBanner.title')}
            </h2>
          </div>
          
          {/* Description */}
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            {t('cookieBanner.text')}
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={acceptAll}
              className="flex-1 sm:flex-none"
              size="lg"
            >
              {t('cookieBanner.acceptAll')}
            </Button>
            <Button 
              onClick={rejectNonEssential}
              variant="secondary"
              className="flex-1 sm:flex-none"
              size="lg"
            >
              {t('cookieBanner.rejectNonEssential')}
            </Button>
            <Button 
              onClick={openModal}
              variant="ghost"
              className="flex-1 sm:flex-none"
              size="lg"
            >
              <Settings className="h-4 w-4 mr-2" />
              {t('cookieBanner.settings')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
