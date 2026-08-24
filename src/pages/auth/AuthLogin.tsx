import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { TURNSTILE_SITE_KEY } from '@/config/turnstile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

export default function AuthLogin() {
  const { t } = useTranslation();
  const { user, signInWithPassword, signInWithMagicLink } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  // A Turnstile token is single-use: verifying it spends it at Cloudflare.
  // After any failed attempt the widget still shows "Success!" while holding a
  // token the server will now reject, so the next submit fails with a
  // misleading "fill in the CAPTCHA". Reset the widget to issue a fresh one.
  const resetCaptcha = () => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/account');
    }
  }, [user, navigate]);

  const verifyCaptcha = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-captcha', {
        body: { token },
      });
      return !error && data?.success === true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error(t('auth.invalidEmail'));
      return;
    }

    if (mode === 'password') {
      if (!password) {
        toast.error(t('auth.passwordTooShort'));
        return;
      }
      if (!captchaToken && !captchaError) {
        toast.error(t('auth.captchaRequired'));
        return;
      }

      setIsLoading(true);
      
      // Skip captcha verification if there was a captcha error (fallback mode)
      if (!captchaError && captchaToken && captchaToken !== 'bypass') {
        const isValid = await verifyCaptcha(captchaToken);
        if (!isValid) {
          toast.error(t('auth.captchaRequired'));
          resetCaptcha();
          setIsLoading(false);
          return;
        }
      }

      const { error } = await signInWithPassword(email, password);
      setIsLoading(false);

      if (error) {
        toast.error(t('auth.invalidCredentials'));
        resetCaptcha();
      } else {
        navigate('/account');
      }
    } else {
      setIsLoading(true);
      const { error } = await signInWithMagicLink(email);
      setIsLoading(false);

      if (error) {
        toast.error(error.message);
      } else {
        setMagicLinkSent(true);
      }
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-accent h-16 flex items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="IBRIX" className="h-8 w-auto" />
            <span className="font-heading font-bold text-xl text-accent-foreground">IBRIX</span>
          </Link>
          <Link to="/" className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-accent-foreground" />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-[560px] bg-card rounded-2xl shadow-lg p-6 md:p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
              {t('auth.magicLinkSent')}
            </h1>
            <p className="text-muted-foreground mb-6">{t('auth.checkEmail')}</p>
            <p className="text-sm text-muted-foreground">{t('auth.checkSpam')}</p>
            <Button
              variant="outline"
              onClick={() => setMagicLinkSent(false)}
              className="mt-6"
            >
              {t('auth.backToLogin')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          {/* Back button */}
          <Link 
            to="/auth" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Link>

          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
            {t('auth.login')}
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {t('authFlow.loginSubtitle')}
          </p>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                mode === 'password'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('auth.loginWithPassword')}
            </button>
            <button
              onClick={() => setMode('magic')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                mode === 'magic'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('auth.getMagicLink')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
                placeholder="jonas@pavyzdys.lt"
              />
            </div>

            {mode === 'password' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="password" className="text-foreground">{t('auth.password')}</Label>
                    <Link 
                      to="/auth/reset-password" 
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {!captchaError && (
                  <div className="flex justify-center">
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={TURNSTILE_SITE_KEY}
                      onSuccess={(token) => {
                        setCaptchaToken(token);
                        setCaptchaError(false);
                      }}
                      onError={() => {
                        setCaptchaToken('bypass');
                        setCaptchaError(true);
                      }}
                      onExpire={() => setCaptchaToken(null)}
                    />
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              disabled={isLoading || (mode === 'password' && !captchaToken)}
              className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.loggingIn')}
                </>
              ) : mode === 'password' ? (
                t('auth.login')
              ) : (
                t('auth.getMagicLink')
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            {t('auth.dontHaveAccount')}{' '}
            <Link to="/auth/signup/step-1" className="text-primary hover:text-primary/80 font-medium">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
