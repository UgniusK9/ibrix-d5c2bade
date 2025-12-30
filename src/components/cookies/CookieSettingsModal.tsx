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
    name: 'Būtini (privalomi)',
    description: 'Reikalingi svetainės veikimui ir saugumui. Jų išjungti negalima.',
    icon: Shield,
    required: true,
  },
  {
    id: 'functional',
    name: 'Funkciniai',
    description: 'Padeda veikti pirkimo funkcijoms (pvz., krepšeliui / apmokėjimui) ir patogumui.',
    icon: Cog,
    required: false,
  },
  {
    id: 'analytics',
    name: 'Analitika',
    description: 'Padeda suprasti, kaip naudojama svetainė (pvz., lankomumas, paspaudimai), kad galėtume ją pagerinti.',
    icon: BarChart3,
    required: false,
  },
  {
    id: 'marketing',
    name: 'Marketingas',
    description: 'Naudojama reklamos matavimui ir personalizavimui (pvz., Meta/Google).',
    icon: Megaphone,
    required: false,
  },
];

export function CookieSettingsModal() {
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
          <DialogTitle className="font-heading text-xl">Slapukų nustatymai</DialogTitle>
          <DialogDescription>
            Pasirinkite, kokius slapukus norite leisti. Būtini slapukai reikalingi svetainės veikimui.
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
                      {category.name}
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
                    {category.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Footer links */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
          <Link to="/slapukai" className="hover:text-foreground transition-colors underline underline-offset-2">
            Slapukų politika
          </Link>
          <Link to="/privatumo-politika" className="hover:text-foreground transition-colors underline underline-offset-2">
            Privatumo politika
          </Link>
        </div>
        
        {/* Save button */}
        <Button onClick={handleSave} className="w-full" size="lg">
          Išsaugoti pasirinkimą
        </Button>
      </DialogContent>
    </Dialog>
  );
}
