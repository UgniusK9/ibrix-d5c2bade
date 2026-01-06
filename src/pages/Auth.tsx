import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, Lock, Eye, EyeOff, ArrowLeft, User, KeyRound } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const emailSchema = z.string().email('Neteisingas el. pašto formatas');
const passwordSchema = z.string().min(6, 'Slaptažodis turi būti bent 6 simbolių');

// Turnstile site key - this is a publishable key, safe to include in frontend
const TURNSTILE_SITE_KEY = '0x4AAAAAABfMVCkCKkJJhz3a';

type AuthMode = 'login' | 'register' | 'forgot' | 'magic-link';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user, isLoading, signInWithPassword, signInWithMagicLink, signUp, resetPassword } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password');
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string; captcha?: string }>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const redirectTo = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (!isLoading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, isLoading, navigate, redirectTo]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if ((mode === 'login' && loginMethod === 'password') || mode === 'register') {
      const passResult = passwordSchema.safeParse(password);
      if (!passResult.success) {
        newErrors.password = passResult.error.errors[0].message;
      }
    }

    if (mode === 'register' && password !== confirmPassword) {
      newErrors.confirm = 'Slaptažodžiai nesutampa';
    }

    // Require CAPTCHA for registration
    if (mode === 'register' && !captchaToken) {
      newErrors.captcha = 'Prašome patvirtinti, kad nesate robotas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      let result: { error: Error | null };

      if (mode === 'login' && loginMethod === 'password') {
        result = await signInWithPassword(email, password);
        if (result.error) {
          if (result.error.message.includes('Invalid login')) {
            toast.error('Neteisingas el. paštas arba slaptažodis');
          } else if (result.error.message.includes('Email not confirmed')) {
            toast.error('Patvirtinkite el. paštą prieš prisijungdami');
          } else {
            toast.error('Prisijungti nepavyko. Bandykite dar kartą.');
          }
        } else {
          toast.success('Sėkmingai prisijungėte!');
        }
      } else if (mode === 'login' && loginMethod === 'magic-link') {
        result = await signInWithMagicLink(email);
        if (result.error) {
          if (result.error.message.includes('rate limit')) {
            toast.error('Per daug bandymų. Palaukite ir bandykite vėliau.');
          } else {
            toast.error('Nepavyko išsiųsti. Bandykite dar kartą.');
          }
        } else {
          setEmailSent(true);
          toast.success('Prisijungimo nuoroda išsiųsta!');
        }
      } else if (mode === 'register') {
        // Verify CAPTCHA server-side first
        const { data: captchaResult, error: captchaError } = await supabase.functions.invoke('verify-captcha', {
          body: { token: captchaToken }
        });
        
        if (captchaError || !captchaResult?.success) {
          toast.error('CAPTCHA patvirtinimas nepavyko. Bandykite dar kartą.');
          setCaptchaToken(null);
          setLoading(false);
          return;
        }
        
        result = await signUp(email, password);
        if (result.error) {
          if (result.error.message.includes('already registered')) {
            toast.error('Šis el. paštas jau užregistruotas');
          } else {
            toast.error('Registracija nepavyko. Bandykite dar kartą.');
          }
        } else {
          setEmailSent(true);
          toast.success('Paskyra sukurta! Patikrinkite el. paštą.');
        }
      } else if (mode === 'forgot') {
        result = await resetPassword(email);
        if (result.error) {
          toast.error('Nepavyko išsiųsti. Bandykite dar kartą.');
        } else {
          setEmailSent(true);
          toast.success('Slaptažodžio atkūrimo nuoroda išsiųsta!');
        }
      }
    } catch (e) {
      toast.error('Įvyko klaida. Bandykite dar kartą.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setEmailSent(false);
    setCaptchaToken(null);
  };

  const switchToForgot = () => {
    resetForm();
    setMode('forgot');
  };

  const backToLogin = () => {
    resetForm();
    setMode('login');
    setActiveTab('login');
    setLoginMethod('password');
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  // Email sent confirmation screen
  if (emailSent) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-premium text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h1 className="font-heading text-2xl font-bold mb-3">
                {mode === 'register' ? 'Paskyra sukurta!' : 
                 mode === 'forgot' ? 'Nuoroda išsiųsta!' : 
                 'Patikrinkite el. paštą'}
              </h1>
              <p className="text-muted-foreground mb-2">
                {mode === 'register' 
                  ? 'Išsiuntėme patvirtinimo nuorodą į' 
                  : mode === 'forgot'
                  ? 'Išsiuntėme slaptažodžio atkūrimo nuorodą į'
                  : 'Išsiuntėme prisijungimo nuorodą į'}
              </p>
              <p className="font-semibold text-foreground mb-6">{email}</p>
              <p className="text-sm text-muted-foreground mb-6">
                Neradote laiško? Patikrinkite spam/šlamšto aplanką.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={backToLogin}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Grįžti į prisijungimą
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Forgot password screen
  if (mode === 'forgot') {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-premium">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-primary" />
                </div>
                <h1 className="font-heading text-2xl font-bold">Atkurti slaptažodį</h1>
                <p className="text-muted-foreground mt-2">
                  Įveskite savo el. paštą ir atsiųsime slaptažodžio atkūrimo nuorodą
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">El. paštas</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jusu@pastas.lt"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    disabled={loading}
                    className="mt-2 h-12"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1.5">{errors.email}</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Siunčiama...
                    </>
                  ) : (
                    'Siųsti atkūrimo nuorodą'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={backToLogin}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Grįžti į prisijungimą
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-premium">
            {/* Logo / Brand */}
            <div className="text-center mb-6">
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                IBRIX
              </h1>
              <p className="text-muted-foreground mt-1">
                Premium LEGO® variklių modeliai
              </p>
            </div>

            {/* Tabs: Login / Register */}
            <Tabs value={activeTab} onValueChange={(v) => {
              setActiveTab(v as 'login' | 'register');
              setMode(v as 'login' | 'register');
              resetForm();
            }}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-sm font-medium">
                  Prisijungti
                </TabsTrigger>
                <TabsTrigger value="register" className="text-sm font-medium">
                  Registruotis
                </TabsTrigger>
              </TabsList>

              {/* LOGIN TAB */}
              <TabsContent value="login" className="space-y-5 mt-0">
                {/* Login method selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('password')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      loginMethod === 'password' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Lock className={`w-5 h-5 ${loginMethod === 'password' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${loginMethod === 'password' ? 'text-primary' : 'text-muted-foreground'}`}>
                      Slaptažodžiu
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('magic-link')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      loginMethod === 'magic-link' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Mail className={`w-5 h-5 ${loginMethod === 'magic-link' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${loginMethod === 'magic-link' ? 'text-primary' : 'text-muted-foreground'}`}>
                      El. paštu
                    </span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="text-sm font-medium">El. paštas</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="jusu@pastas.lt"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      disabled={loading}
                      className="mt-2 h-12"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1.5">{errors.email}</p>
                    )}
                  </div>

                  {loginMethod === 'password' && (
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-sm font-medium">Slaptažodis</Label>
                        <button
                          type="button"
                          onClick={switchToForgot}
                          className="text-xs text-primary hover:underline"
                        >
                          Pamiršote?
                        </button>
                      </div>
                      <div className="relative mt-2">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrors((prev) => ({ ...prev, password: undefined }));
                          }}
                          disabled={loading}
                          className="h-12 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive mt-1.5">{errors.password}</p>
                      )}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Palaukite...
                      </>
                    ) : loginMethod === 'password' ? (
                      'Prisijungti'
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Gauti prisijungimo nuorodą
                      </>
                    )}
                  </Button>
                </form>

                {loginMethod === 'password' && (
                  <p className="text-center text-sm text-muted-foreground">
                    Nenorite prisiminti slaptažodžio?{' '}
                    <button
                      type="button"
                      onClick={() => setLoginMethod('magic-link')}
                      className="text-primary hover:underline font-medium"
                    >
                      Prisijunkite el. paštu
                    </button>
                  </p>
                )}
              </TabsContent>

              {/* REGISTER TAB */}
              <TabsContent value="register" className="space-y-5 mt-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="register-email" className="text-sm font-medium">El. paštas</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="jusu@pastas.lt"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      disabled={loading}
                      className="mt-2 h-12"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1.5">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="register-password" className="text-sm font-medium">Slaptažodis</Label>
                    <div className="relative mt-2">
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Bent 6 simboliai"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        disabled={loading}
                        className="h-12 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive mt-1.5">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="register-confirm" className="text-sm font-medium">Pakartokite slaptažodį</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, confirm: undefined }));
                      }}
                      disabled={loading}
                      className="mt-2 h-12"
                    />
                    {errors.confirm && (
                      <p className="text-sm text-destructive mt-1.5">{errors.confirm}</p>
                    )}
                  </div>

                  {/* Turnstile CAPTCHA */}
                  <div className="flex flex-col items-center">
                    <Turnstile
                      siteKey={TURNSTILE_SITE_KEY}
                      onSuccess={(token) => {
                        setCaptchaToken(token);
                        setErrors((prev) => ({ ...prev, captcha: undefined }));
                      }}
                      onError={() => {
                        setCaptchaToken(null);
                        setErrors((prev) => ({ ...prev, captcha: 'CAPTCHA nepavyko. Bandykite dar kartą.' }));
                      }}
                      onExpire={() => setCaptchaToken(null)}
                    />
                    {errors.captcha && (
                      <p className="text-sm text-destructive mt-1.5">{errors.captcha}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-12 text-base" disabled={loading || !captchaToken}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('auth.creating')}
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        {t('auth.createAccount')}
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-xs text-center text-muted-foreground">
                  Registruodamiesi sutinkate su{' '}
                  <Link to="/taisykles" className="text-primary hover:underline">
                    taisyklėmis
                  </Link>{' '}
                  ir{' '}
                  <Link to="/privatumo-politika" className="text-primary hover:underline">
                    privatumo politika
                  </Link>
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
