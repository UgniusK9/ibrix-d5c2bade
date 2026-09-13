import { useTranslation } from "react-i18next";
import { useCookieConsentStore, CookieConsent } from '@/stores/cookieConsentStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Shield, Cog, BarChart3, Megaphone } from 'lucide-react';

interface ConsentCategory {
  id: keyof Omit<CookieConsent, 'updatedAt' | 'version'>;
  name: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
}

const categories: ConsentCategory[] = [
  {
    id: 'necessary',
    name: 'cookieBanner.necessary',
    description: 'cookieBanner.necessaryDesc',
    icon: Shield,
    required: true,
  },
  {
    id: 'functional',
    name: 'cookieBanner.functional',
    description: 'cookieBanner.functionalDesc',
    icon: Cog,
    required: false,
  },
  {
    id: 'analytics',
    name: 'cookieBanner.analytics',
    description: 'cookieBanner.analyticsDesc',
    icon: BarChart3,
    required: false,
  },
  {
    id: 'marketing',
    name: 'cookieBanner.marketing',
    description: 'cookieBanner.marketingDesc',
    icon: Megaphone,
    required: false,
  },
];

export function CookieSettingsModal() {
  const { t } = useTranslation();
  const { consent, isModalOpen, closeModal, setConsent } = useCookieConsentStore();
  
  const [localConsent, setLocalConsent] = useState({
    necessary: true,
    functional: consent?.functional ?? false,
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  });
  
  // Sync with store when modal opens
  useEffect(() => {
    if (isModalOpen && consent) {
      setLocalConsent({
        necessary: true,
        functional: consent.functional,
        analytics: consent.analytics,
        marketing: consent.marketing,
      });
    }
  }, [isModalOpen, consent]);
  
  const handleToggle = (id: keyof typeof localConsent) => {
    if (id === 'necessary') return; // Cannot toggle necessary
    setLocalConsent(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const handleSave = () => {
    setConsent(localConsent);
  };
  
  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{t('cookieBanner.settingsTitle')}</DialogTitle>
          <DialogDescription>
            {t('cookieBanner.settingsText')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const isEnabled = localConsent[category.id];
            
            return (
              <div 
                key={category.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <Label 
                      htmlFor={category.id}
                      className="font-medium text-foreground cursor-pointer"
                    >
                      {t(category.name)}
                    </Label>
                    <Switch
                      id={category.id}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(category.id)}
                      disabled={category.required}
                      className={category.required ? 'opacity-60' : ''}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(category.description)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Footer links */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
          <Link to="/slapukai" className="hover:text-foreground transition-colors underline underline-offset-2">
            {t('nav.cookies')}
          </Link>
          <Link to="/privatumo-politika" className="hover:text-foreground transition-colors underline underline-offset-2">
            {t('nav.privacy')}
          </Link>
        </div>
        
        {/* Save button */}
        <Button onClick={handleSave} className="w-full" size="lg">
          {t('cookieBanner.save')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
