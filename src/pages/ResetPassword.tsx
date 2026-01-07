import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { Link } from 'react-router-dom';

const emailSchema = z.string().email('Neteisingas el. pašto formatas');
const passwordSchema = z.string().min(6, 'Slaptažodis turi būti bent 6 simbolių');

type Step = 'email' | 'email-sent' | 'new-password' | 'success';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword, isLoading } = useAuth();
  
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Listen for PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ResetPassword] Auth event:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[ResetPassword] Password recovery mode detected');
        setIsRecoveryMode(true);
        setStep('new-password');
      }
    });

    // Also check current session - if user came from recovery link, they'll have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Check URL for recovery tokens
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery' && session) {
        console.log('[ResetPassword] Recovery session detected from URL');
        setIsRecoveryMode(true);
        setStep('new-password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateEmail = () => {
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return false;
    }
    setErrors({});
    return true;
  };

  const validatePassword = () => {
    const newErrors: typeof errors = {};
    
    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) {
      newErrors.password = passResult.error.errors[0].message;
    }

    if (password !== confirmPassword) {
      newErrors.confirm = 'Slaptažodžiai nesutampa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);

    try {
      // Call our custom edge function that sends branded email
      const response = await supabase.functions.invoke('request-password-reset', {
        body: { email },
      });
      
      if (response.error) {
        console.error('[ResetPassword] Error:', response.error);
        toast.error('Nepavyko išsiųsti nuorodos. Bandykite dar kartą.');
      } else {
        setStep('email-sent');
      }
    } catch (e) {
      console.error('[ResetPassword] Exception:', e);
      toast.error('Įvyko klaida. Bandykite dar kartą.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      
      if (error) {
        console.error('[ResetPassword] Update password error:', error);
        toast.error('Nepavyko pakeisti slaptažodžio. Bandykite dar kartą.');
      } else {
        setStep('success');
        toast.success('Slaptažodis sėkmingai pakeistas!');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (e) {
      console.error('[ResetPassword] Exception:', e);
      toast.error('Įvyko klaida. Bandykite dar kartą.');
    } finally {
      setLoading(false);
    }
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

  // Success state
  if (step === 'success') {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-sm">
            <div className="bg-card border border-border rounded-xl p-6 shadow-premium text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <h1 className="font-heading text-xl font-bold mb-2">
                Slaptažodis pakeistas!
              </h1>
              <p className="text-sm text-muted-foreground">
                Nukreipiame į pagrindinį puslapį...
              </p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Email sent confirmation
  if (step === 'email-sent') {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-sm">
            <div className="bg-card border border-border rounded-xl p-6 shadow-premium text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h1 className="font-heading text-xl font-bold mb-2">
                Patikrinkite el. paštą
              </h1>
              <p className="text-sm text-muted-foreground mb-4">
                Išsiuntėme slaptažodžio atkūrimo nuorodą į <strong>{email}</strong>
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Jei negavote laiško, patikrinkite šlamšto (spam) aplanką.
              </p>
              <Link to="/auth">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Grįžti į prisijungimą
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // New password form (after clicking email link)
  if (step === 'new-password') {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-sm">
            <div className="bg-card border border-border rounded-xl p-6 shadow-premium">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-heading text-xl font-bold">Naujas slaptažodis</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Įveskite naują slaptažodį
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password" className="text-sm">Naujas slaptažodis</Label>
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Keičiama...
                    </>
                  ) : (
                    'Pakeisti slaptažodį'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Email input form (initial state)
  return (
    <PageLayout>
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-card border border-border rounded-xl p-6 shadow-premium">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h1 className="font-heading text-xl font-bold">Pamiršote slaptažodį?</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Įveskite savo el. pašto adresą ir mes atsiųsime atkūrimo nuorodą
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Siunčiama...
                  </>
                ) : (
                  'Siųsti atkūrimo nuorodą'
                )}
              </Button>

              <Link to="/auth" className="block">
                <Button variant="ghost" className="w-full text-muted-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Grįžti į prisijungimą
                </Button>
              </Link>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
