import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gift, Star, Clock, Wallet, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import logo from '@/assets/logo.png';

export default function AuthLanding() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/account');
    }
  }, [user, navigate]);

  const benefits = [
    { icon: Star, text: t('authFlow.benefit1') },
    { icon: Wallet, text: t('authFlow.benefit2') },
    { icon: Gift, text: t('authFlow.benefit3') },
    { icon: Clock, text: t('authFlow.benefit4') },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with accent bar */}
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
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
            {t('authFlow.landingTitle')}
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            {t('authFlow.landingSubtitle')}
          </p>

          {/* Buttons */}
          <div className="space-y-3 mb-8">
            <Button
              asChild
              className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
            >
              <Link to="/auth/signup/step-1">{t('authFlow.becomeMember')}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full h-12 rounded-full font-semibold text-base"
            >
              <Link to="/auth/login">{t('auth.login')}</Link>
            </Button>
          </div>

          {/* Track order link */}
          <Link 
            to="/siuntos-sekimas" 
            className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors mb-8"
          >
            <Search className="w-4 h-4" />
            {t('authFlow.trackOrder')}
          </Link>

          {/* Benefits */}
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
              {t('authFlow.memberBenefits')}
            </h3>
            <div className="space-y-3">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-foreground">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
