import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CreditsBlockProps {
  subtotalCents: number;
  onCreditsChange: (amountCents: number) => void;
}

export function CreditsBlock({ subtotalCents, onCreditsChange }: CreditsBlockProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0);
  const [maxRedeemPercent, setMaxRedeemPercent] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Load wallet balance
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance_eur')
          .eq('user_id', user.id)
          .maybeSingle();

        if (walletData) {
          setBalance(walletData.balance_eur);
        }

        // Load max redeem setting
        const { data: settingData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'credits.max_redeem_percent')
          .maybeSingle();

        if (settingData) {
          const value = (settingData.value as { value: number })?.value;
          if (value) {
            setMaxRedeemPercent(value);
          }
        }
      } catch (err) {
        console.error('Error loading credits data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Calculate maximum allowed credits
  const maxAllowedByPercent = Math.floor(subtotalCents * (maxRedeemPercent / 100));
  const maxAllowedByBalance = Math.floor(balance * 100);
  const maxAllowed = Math.min(maxAllowedByPercent, maxAllowedByBalance, subtotalCents);

  useEffect(() => {
    if (useCredits && creditAmount > maxAllowed) {
      setCreditAmount(maxAllowed);
    }
  }, [maxAllowed, useCredits, creditAmount]);

  useEffect(() => {
    onCreditsChange(useCredits ? creditAmount : 0);
  }, [useCredits, creditAmount, onCreditsChange]);

  const handleToggle = (checked: boolean) => {
    setUseCredits(checked);
    if (checked && creditAmount === 0) {
      setCreditAmount(maxAllowed);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setCreditAmount(value[0]);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('lt-LT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  // Don't show if no credits or not logged in
  if (!user || balance <= 0 || loading) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold">{t('credits.checkout.title')}</p>
            <p className="text-sm text-muted-foreground">
              {t('credits.checkout.available')} {formatPrice(balance * 100)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="use-credits" className="text-sm">{t('credits.checkout.use')}</Label>
          <Switch
            id="use-credits"
            checked={useCredits}
            onCheckedChange={handleToggle}
          />
        </div>
      </div>

      {useCredits && (
        <div className="space-y-4 pt-4 border-t border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              {t('credits.checkout.maxAllowed')}
            </span>
            <span className="font-medium">{formatPrice(maxAllowed)} ({maxRedeemPercent}%)</span>
          </div>

          <Slider
            value={[creditAmount]}
            onValueChange={handleSliderChange}
            max={maxAllowed}
            step={100}
            className="py-2"
          />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('credits.checkout.willDeduct')}</span>
            <span className="text-lg font-bold text-amber-600">-{formatPrice(creditAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
