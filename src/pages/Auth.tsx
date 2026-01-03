import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Neteisingas el. pašto formatas');
const passwordSchema = z.string().min(6, 'Slaptažodis turi būti bent 6 simbolių');

type AuthMode = 'login' | 'register' | 'forgot' | 'magic-link';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading, signInWithPassword, signInWithMagicLink, signUp, resetPassword } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});

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

    if (mode === 'login' || mode === 'register') {
      const passResult = passwordSchema.safeParse(password);
      if (!passResult.success) {
        newErrors.password = passResult.error.errors[0].message;
      }
    }

    if (mode === 'register' && password !== confirmPassword) {
      newErrors.confirm = 'Slaptažodžiai nesutampa';
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

      switch (mode) {
        case 'login':
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
          break;

        case 'register':
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
          break;

        case 'forgot':
          result = await resetPassword(email);
          if (result.error) {
            toast.error('Nepavyko išsiųsti. Bandykite dar kartą.');
          } else {
            setEmailSent(true);
            toast.success('Slaptažodžio atkūrimo nuoroda išsiųsta!');
          }
          break;

        case 'magic-link':
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
          break;
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
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
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
          <div className="w-full max-w-sm">
            <div className="bg-card border border-border rounded-xl p-6 shadow-premium text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <h1 className="font-heading text-xl font-bold mb-2">
                {mode === 'register' ? 'Paskyra sukurta!' : 'Patikrinkite el. paštą'}
              </h1>
              <p className="text-sm text-muted-foreground mb-4">
                Išsiuntėme {mode === 'forgot' ? 'slaptažodžio atkūrimo' : 'patvirtinimo'} nuorodą į{' '}
                <strong className="text-foreground">{email}</strong>
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Neradote? Patikrinkite spam aplanką.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => switchMode('login')}
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

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Prisijungti';
      case 'register': return 'Sukurti paskyrą';
      case 'forgot': return 'Atkurti slaptažodį';
      case 'magic-link': return 'Prisijungti nuoroda';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Įveskite prisijungimo duomenis';
      case 'register': return 'Užsiregistruokite per 30 sekundžių';
      case 'forgot': return 'Išsiųsime slaptažodžio atkūrimo nuorodą';
      case 'magic-link': return 'Gaukite prisijungimo nuorodą el. paštu';
    }
  };

  return (
    <PageLayout>
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-card border border-border rounded-xl p-6 shadow-premium">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                {mode === 'magic-link' ? (
                  <Mail className="w-6 h-6 text-primary" />
                ) : (
                  <Lock className="w-6 h-6 text-primary" />
                )}
              </div>
              <h1 className="font-heading text-xl font-bold">{getTitle()}</h1>
              <p className="text-sm text-muted-foreground mt-1">{getSubtitle()}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm">El. paštas</Label>
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
                  className="mt-1.5"
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              {(mode === 'login' || mode === 'register') && (
                <div>
                  <Label htmlFor="password" className="text-sm">Slaptažodis</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive mt-1">{errors.password}</p>
                  )}
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <Label htmlFor="confirm" className="text-sm">Pakartokite slaptažodį</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, confirm: undefined }));
                    }}
                    disabled={loading}
                    className="mt-1.5"
                  />
                  {errors.confirm && (
                    <p className="text-xs text-destructive mt-1">{errors.confirm}</p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Palaukite...
                  </>
                ) : (
                  <>
                    {mode === 'login' && 'Prisijungti'}
                    {mode === 'register' && 'Sukurti paskyrą'}
                    {mode === 'forgot' && 'Siųsti nuorodą'}
                    {mode === 'magic-link' && 'Gauti nuorodą'}
                  </>
                )}
              </Button>
            </form>

            {/* Mode switches */}
            <div className="mt-5 pt-5 border-t border-border space-y-3">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-sm text-muted-foreground hover:text-primary w-full text-center"
                  >
                    Pamiršote slaptažodį?
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">arba</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => switchMode('magic-link')}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Prisijungti el. paštu (be slaptažodžio)
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Neturite paskyros?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-primary hover:underline font-medium"
                    >
                      Registruotis
                    </button>
                  </p>
                </>
              )}

              {mode === 'register' && (
                <p className="text-sm text-center text-muted-foreground">
                  Jau turite paskyrą?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Prisijungti
                  </button>
                </p>
              )}

              {(mode === 'forgot' || mode === 'magic-link') && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-sm text-muted-foreground hover:text-primary w-full text-center flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Grįžti į prisijungimą
                </button>
              )}
            </div>

            {/* Terms */}
            {mode === 'register' && (
              <p className="text-xs text-center text-muted-foreground mt-4">
                Registruodamiesi sutinkate su{' '}
                <Link to="/taisykles" className="text-primary hover:underline">
                  taisyklėmis
                </Link>{' '}
                ir{' '}
                <Link to="/privatumo-politika" className="text-primary hover:underline">
                  privatumo politika
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}