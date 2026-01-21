import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Star, Wallet, Gift, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ConsentModal } from '@/components/auth/ConsentModal';
import logo from '@/assets/logo.png';

export default function AuthSuccess() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [showMarketingConsent, setShowMarketingConsent] = useState(false);
  const [showPersonalizationConsent, setShowPersonalizationConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const benefits = [
    { icon: Star, text: t('authFlow.benefit1') },
    { icon: Wallet, text: t('authFlow.benefit2') },
    { icon: Gift, text: t('authFlow.benefit3') },
    { icon: Clock, text: t('authFlow.benefit4') },
  ];

  useEffect(() => {
    const checkConsents = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('users')
        .select('marketing_opt_in, personalization_opt_in')
        .eq('id', user.id)
        .single();

      if (data) {
        // If both consent flags are null, we need to show modals
        if (data.marketing_opt_in === null) {
          setShowMarketingConsent(true);
        } else if (data.personalization_opt_in === null) {
          setShowPersonalizationConsent(true);
        }
      }
      setConsentChecked(true);
    };

    checkConsents();
  }, [user]);

  const handleContinue = async () => {
    if (!user) {
      navigate('/account');
      return;
    }

    // Check if we need to show consent modals
    const { data } = await supabase
      .from('users')
      .select('marketing_opt_in, personalization_opt_in')
      .eq('id', user.id)
      .single();

    if (data?.marketing_opt_in === null) {
      setShowMarketingConsent(true);
    } else if (data?.personalization_opt_in === null) {
      setShowPersonalizationConsent(true);
    } else {
      navigate('/account');
    }
  };

  const handleMarketingConsent = async (accepted: boolean) => {
    if (!user) return;
    
    await supabase.from('users').update({
      marketing_opt_in: accepted,
      marketing_opt_in_at: new Date().toISOString(),
    }).eq('id', user.id);

    setShowMarketingConsent(false);
    
    // Check for personalization consent
    const { data } = await supabase
      .from('users')
      .select('personalization_opt_in')
      .eq('id', user.id)
      .single();

    if (data?.personalization_opt_in === null) {
      setShowPersonalizationConsent(true);
    } else {
      navigate('/account');
    }
  };

  const handlePersonalizationConsent = async (accepted: boolean) => {
    if (!user) return;
    
    await supabase.from('users').update({
      personalization_opt_in: accepted,
      personalization_opt_in_at: new Date().toISOString(),
    }).eq('id', user.id);

    setShowPersonalizationConsent(false);
    navigate('/account');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-accent h-16 flex items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="IBRIX" className="h-8 w-auto" />
          <span className="font-heading font-bold text-xl text-accent-foreground">IBRIX</span>
        </Link>
        <Link to="/" className="p-2 hover:bg-black/10 rounded-full transition-colors">
          <X className="w-6 h-6 text-accent-foreground" />
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-[560px] bg-card rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>

            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
              {t('authFlow.successTitle')}
            </h1>
            <p className="text-muted-foreground">
              {t('authFlow.successSubtitle')}
            </p>
          </div>

          {/* Benefits card */}
          <div className="bg-muted rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {t('authFlow.memberBenefits')}
            </h3>
            <div className="space-y-3">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-foreground">
                  <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center flex-shrink-0 shadow-sm">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
          >
            {t('common.continue')}
          </Button>
        </div>
      </div>

      {/* Consent Modals */}
      <ConsentModal
        isOpen={showMarketingConsent}
        type="marketing"
        onAccept={() => handleMarketingConsent(true)}
        onDecline={() => handleMarketingConsent(false)}
      />

      <ConsentModal
        isOpen={showPersonalizationConsent}
        type="personalization"
        onAccept={() => handlePersonalizationConsent(true)}
        onDecline={() => handlePersonalizationConsent(false)}
      />
    </div>
  );
}
