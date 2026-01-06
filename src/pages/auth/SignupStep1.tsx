import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

const COUNTRIES = [
  { code: 'LT', name: 'Lietuva' },
  { code: 'LV', name: 'Latvija' },
  { code: 'EE', name: 'Estija' },
  { code: 'PL', name: 'Lenkija' },
  { code: 'DE', name: 'Vokietija' },
  { code: 'GB', name: 'Jungtinė Karalystė' },
  { code: 'OTHER', name: 'Kita' },
];

export default function SignupStep1() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [country, setCountry] = useState('LT');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [errors, setErrors] = useState<{ day?: string; month?: string; year?: string }>({});

  useEffect(() => {
    if (user) {
      navigate('/account');
    }
  }, [user, navigate]);

  // Restore saved data
  useEffect(() => {
    const saved = localStorage.getItem('signup_step1');
    if (saved) {
      const data = JSON.parse(saved);
      setCountry(data.country || 'LT');
      setDobDay(data.dobDay || '');
      setDobMonth(data.dobMonth || '');
      setDobYear(data.dobYear || '');
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    const day = parseInt(dobDay, 10);
    const month = parseInt(dobMonth, 10);
    const year = parseInt(dobYear, 10);
    const currentYear = new Date().getFullYear();

    if (!dobDay || day < 1 || day > 31) {
      newErrors.day = t('authFlow.invalidDay');
    }
    if (!dobMonth || month < 1 || month > 12) {
      newErrors.month = t('authFlow.invalidMonth');
    }
    if (!dobYear || year < 1900 || year > currentYear) {
      newErrors.year = t('authFlow.invalidYear');
    }

    // Check if user is at least 16
    if (!Object.keys(newErrors).length) {
      const dob = new Date(year, month - 1, day);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 16) {
        newErrors.year = t('authFlow.mustBe16');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validateForm()) return;

    localStorage.setItem('signup_step1', JSON.stringify({
      country,
      dobDay,
      dobMonth,
      dobYear,
    }));

    navigate('/auth/signup/step-2');
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
            to="/auth" 
            className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Link>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1 flex-1 rounded-full bg-[#0B6BD3]" />
            <div className="h-1 flex-1 rounded-full bg-[#E2E8F0]" />
          </div>

          <p className="text-sm text-[#64748B] mb-2">{t('common.step')} 1 / 2</p>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">
            {t('authFlow.step1Title')}
          </h1>
          <p className="text-[#64748B] mb-8">
            {t('authFlow.step1Subtitle')}
          </p>

          <div className="space-y-6">
            {/* Country select */}
            <div>
              <Label className="text-[#0F172A]">{t('authFlow.country')}</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-12 rounded-xl border-[#E2E8F0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date of birth */}
            <div>
              <Label className="text-[#0F172A]">{t('authFlow.dateOfBirth')}</Label>
              <div className="grid grid-cols-3 gap-3 mt-1">
                <div>
                  <Input
                    placeholder="DD"
                    value={dobDay}
                    onChange={(e) => setDobDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    className={`h-12 rounded-xl border-[#E2E8F0] text-center ${errors.day ? 'border-[#DC2626]' : ''}`}
                    maxLength={2}
                  />
                  {errors.day && <p className="text-[#DC2626] text-xs mt-1">{errors.day}</p>}
                </div>
                <div>
                  <Input
                    placeholder="MM"
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    className={`h-12 rounded-xl border-[#E2E8F0] text-center ${errors.month ? 'border-[#DC2626]' : ''}`}
                    maxLength={2}
                  />
                  {errors.month && <p className="text-[#DC2626] text-xs mt-1">{errors.month}</p>}
                </div>
                <div>
                  <Input
                    placeholder="YYYY"
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className={`h-12 rounded-xl border-[#E2E8F0] text-center ${errors.year ? 'border-[#DC2626]' : ''}`}
                    maxLength={4}
                  />
                  {errors.year && <p className="text-[#DC2626] text-xs mt-1">{errors.year}</p>}
                </div>
              </div>
              <p className="text-xs text-[#64748B] mt-2">{t('authFlow.dobHint')}</p>
            </div>

            <Button
              onClick={handleContinue}
              className="w-full h-12 rounded-full bg-[#0B6BD3] hover:bg-[#095BB3] text-white font-semibold text-base"
            >
              {t('common.continue')}
            </Button>
          </div>

          <p className="text-center text-[#64748B] text-sm mt-6">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/auth/login" className="text-[#0B6BD3] hover:text-[#095BB3] font-medium">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
