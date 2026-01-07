import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const firstName = location.state?.firstName || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Redirect if no email
    if (!email) {
      navigate('/auth/signup/step-2');
    }
  }, [email, navigate]);

  useEffect(() => {
    // Cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleInput = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === 5 && newCode.every(d => d)) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setIsLoading(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-email-code', {
        body: {
          email,
          code: verificationCode,
        },
      });

      if (verifyError || !data?.success) {
        setError(data?.error || 'Neteisingas arba pasibaigęs kodas');
        setIsLoading(false);
        return;
      }

      toast.success('Paskyra sėkmingai sukurta!');
      navigate('/auth/success');
    } catch (err: any) {
      setError(err.message || 'Patvirtinimo klaida');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('resend-verification', {
        body: { email },
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Nepavyko išsiųsti kodo');
      } else {
        toast.success('Naujas kodas išsiųstas');
        setResendCooldown(60);
      }
    } catch {
      toast.error('Nepavyko išsiųsti kodo');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Header */}
      <div className="bg-[#FFD500] h-16 flex items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="IBRIX" className="h-8 w-auto" />
          <span className="font-heading font-bold text-xl text-[#0F172A]">IBRIX</span>
        </Link>
        <Link to="/" className="p-2 hover:bg-black/10 rounded-full transition-colors">
          <X className="w-6 h-6 text-[#0F172A]" />
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-[560px] bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in-up">
          {/* Back button */}
          <Link 
            to="/auth/signup/step-2" 
            className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Link>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#0B6BD3]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#0B6BD3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">
              Suaktyvinkite savo paskyrą
            </h1>
            <p className="text-[#64748B] mb-2">
              Patvirtinimo kodas išsiųstas į:
            </p>
            <p className="font-semibold text-[#0F172A] mb-6">{email}</p>

            {/* Code inputs */}
            <div className="flex justify-center gap-2 mb-4">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleInput(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  maxLength={1}
                  className={`w-12 h-14 text-center text-xl font-semibold rounded-xl border-2 ${
                    error ? 'border-[#DC2626]' : 'border-[#E2E8F0]'
                  } focus:border-[#0B6BD3] focus:ring-[#0B6BD3]`}
                  disabled={isLoading}
                />
              ))}
            </div>

            {error && <p className="text-[#DC2626] text-sm mb-4">{error}</p>}

            <p className="text-[#64748B] text-sm mb-6">
              Jūsų kodas galioja <strong>24 valandas</strong>
            </p>

            <Button
              onClick={() => handleVerify(code.join(''))}
              disabled={isLoading || code.some(d => !d)}
              className="w-full h-12 rounded-full bg-[#0B6BD3] hover:bg-[#095BB3] text-white font-semibold text-base mb-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Tikrinama...
                </>
              ) : (
                t('common.continue')
              )}
            </Button>

            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm text-[#0B6BD3] hover:text-[#095BB3] disabled:text-[#64748B] disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Siųsti kodą iš naujo (${resendCooldown}s)`
                : 'Negavote kodo? Siųsti iš naujo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
