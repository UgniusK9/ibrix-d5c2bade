import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAABfsvMBdRlqOLeDv';

export default function SignupStep2() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    
    if (checks.length) score++;
    if (checks.uppercase) score++;
    if (checks.lowercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;
    
    return { score, checks };
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['', 'Labai silpnas', 'Silpnas', 'Vidutinis', 'Stiprus', 'Labai stiprus'];
  const strengthColors = ['', 'bg-destructive', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

  useEffect(() => {
    if (user) {
      navigate('/account');
    }
  }, [user, navigate]);

  // Check if step 1 was completed
  useEffect(() => {
    const step1 = localStorage.getItem('signup_step1');
    if (!step1) {
      navigate('/auth/signup/step-1');
    }
  }, [navigate]);

  // Debounced username availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    
    const usernameRegex = /^[a-zA-Z0-9_.]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setUsernameAvailable(false);
      return;
    }
    
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase.rpc('check_username_available', {
          check_username: username
        });
        if (!error) {
          setUsernameAvailable(data === true);
        }
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 400);
    
    return () => clearTimeout(timer);
  }, [username]);

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName || firstName.length < 2) {
      newErrors.firstName = t('authFlow.nameTooShort');
    }
    if (!lastName || lastName.length < 2) {
      newErrors.lastName = t('authFlow.nameTooShort');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('auth.invalidEmail');
    }
    // Username validation (optional, but if provided must be valid)
    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_.]{3,20}$/;
      if (!usernameRegex.test(username)) {
        newErrors.username = t('authFlow.usernameInvalid');
      } else if (usernameAvailable === false) {
        newErrors.username = t('authFlow.usernameTaken');
      }
    }
    if (!password || password.length < 8) {
      newErrors.password = t('authFlow.passwordMin8');
    }
    if (!confirmPassword || confirmPassword !== password) {
      newErrors.confirmPassword = t('settings.passwordMismatch');
    }
    if (!termsAccepted) {
      newErrors.terms = t('authFlow.termsRequired');
    }
    if (!captchaToken && !captchaError) {
      newErrors.captcha = t('auth.captchaRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    // Verify captcha server-side (skip if widget failed and we are in fallback mode)
    if (!captchaError && captchaToken && captchaToken !== 'bypass') {
      const isValid = await verifyCaptcha(captchaToken);
      if (!isValid) {
        toast.error(t('auth.captchaRequired'));
        setCaptchaToken(null);
        setIsLoading(false);
        return;
      }
    }

    // Get step 1 data
    const step1Data = JSON.parse(localStorage.getItem('signup_step1') || '{}');
    const dob = step1Data.dobYear && step1Data.dobMonth && step1Data.dobDay
      ? `${step1Data.dobYear}-${step1Data.dobMonth.padStart(2, '0')}-${step1Data.dobDay.padStart(2, '0')}`
      : null;

    try {
      // Store password temporarily for verification step using sessionStorage
      // sessionStorage is cleared when tab closes, reducing XSS exposure window
      sessionStorage.setItem('signup_pending_password', password);
      
      // Call custom signup edge function (sends verification code - NO password sent)
      const { data, error } = await supabase.functions.invoke('signup', {
        body: {
          email,
          firstName,
          lastName,
          username: username || null,
          country: step1Data.country,
          dateOfBirth: dob,
        },
      });

      if (error || !data?.success) {
        setIsLoading(false);
        toast.error(data?.error || error?.message || 'Registracijos klaida');
        return;
      }

      // Clean up step 1 data
      localStorage.removeItem('signup_step1');

      setIsLoading(false);
      toast.success('Patvirtinimo kodas išsiųstas į el. paštą');
      navigate('/auth/verify-email', { state: { email, firstName } });
    } catch (err: any) {
      setIsLoading(false);
      toast.error(err.message || 'Registracijos klaida');
    }
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
          {/* Back button */}
          <Link 
            to="/auth/signup/step-1" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Link>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1 flex-1 rounded-full bg-primary" />
            <div className="h-1 flex-1 rounded-full bg-primary" />
          </div>

          <p className="text-sm text-muted-foreground mb-2">{t('common.step')} 2 / 2</p>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t('authFlow.step2Title')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('authFlow.step2Subtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-foreground">{t('authFlow.firstName')}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`h-12 rounded-xl ${errors.firstName ? 'border-destructive' : ''}`}
                />
                {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="lastName" className="text-foreground">{t('authFlow.lastName')}</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`h-12 rounded-xl ${errors.lastName ? 'border-destructive' : ''}`}
                />
                {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-foreground">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-12 rounded-xl ${errors.email ? 'border-destructive' : ''}`}
                placeholder="jonas@pavyzdys.lt"
              />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="username" className="text-foreground">
                {t('authFlow.username')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span>
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  className={`h-12 rounded-xl pr-10 ${errors.username ? 'border-destructive' : usernameAvailable === true ? 'border-success' : ''}`}
                  placeholder="jonas_123"
                  maxLength={20}
                />
                {checkingUsername && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {!checkingUsername && username.length >= 3 && usernameAvailable === true && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-success text-sm">✓</span>
                )}
                {!checkingUsername && username.length >= 3 && usernameAvailable === false && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive text-sm">✗</span>
                )}
              </div>
              <p className="text-muted-foreground text-xs mt-1">{t('authFlow.usernameHint')}</p>
              {errors.username && <p className="text-destructive text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-12 rounded-xl pr-12 ${errors.password ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength.score ? strengthColors[passwordStrength.score] : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength.score >= 4 ? 'text-success' : 'text-muted-foreground'}`}>
                    {strengthLabels[passwordStrength.score]}
                  </p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className={passwordStrength.checks.length ? 'text-success' : ''}>
                      {passwordStrength.checks.length ? '✓' : '○'} Mažiausiai 8 simboliai
                    </p>
                    <p className={passwordStrength.checks.uppercase ? 'text-success' : ''}>
                      {passwordStrength.checks.uppercase ? '✓' : '○'} Didžioji raidė (A-Z)
                    </p>
                    <p className={passwordStrength.checks.number ? 'text-success' : ''}>
                      {passwordStrength.checks.number ? '✓' : '○'} Skaičius (0-9)
                    </p>
                    <p className={passwordStrength.checks.special ? 'text-success' : ''}>
                      {passwordStrength.checks.special ? '✓' : '○'} Specialus simbolis (!@#$...)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-foreground">{t('settings.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`h-12 rounded-xl pr-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-start gap-3 py-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-foreground leading-snug cursor-pointer">
                {t('authFlow.termsLabel')}{' '}
                <Link to="/taisykles" className="text-primary hover:underline" target="_blank">
                  {t('authFlow.termsLink')}
                </Link>{' '}
                {t('common.and')}{' '}
                <Link to="/privatumo-politika" className="text-primary hover:underline" target="_blank">
                  {t('authFlow.privacyLink')}
                </Link>
              </label>
            </div>
            {errors.terms && <p className="text-destructive text-xs -mt-2">{errors.terms}</p>}

            <div className="flex justify-center">
              <Turnstile
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
            {errors.captcha && <p className="text-destructive text-xs text-center">{errors.captcha}</p>}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.creating')}
                </>
              ) : (
                t('authFlow.createAccountBtn')
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/auth/login" className="text-primary hover:text-primary/80 font-medium">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
