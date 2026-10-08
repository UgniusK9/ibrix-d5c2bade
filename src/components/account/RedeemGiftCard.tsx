import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface RedeemGiftCardProps {
  onSuccess?: (amount: number) => void;
}

export function RedeemGiftCard({ onSuccess }: RedeemGiftCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; amount?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const handleRedeem = async () => {
    setError(null);

    if (!code.trim()) {
      setError(t('redeem.enterCode'));
      return;
    }

    if (!user) {
      setError(t('redeem.loginRequired'));
      return;
    }

    setIsRedeeming(true);
    try {
      // The server checks the code and credits the wallet; the browser cannot (RLS).
      const { data, error: fnError } = await supabase.functions.invoke('redeem-gift-card', {
        body: { code },
      });

      if (fnError) {
        if (fnError instanceof FunctionsHttpError) {
          const body = await fnError.context.json().catch(() => null);
          if (body?.error === 'invalid_code') setError(t('redeem.alreadyUsed'));
          else if (body?.error === 'too_many_attempts') setError(t('redeem.tooManyAttempts'));
          else if (body?.error === 'unauthorized') setError(t('redeem.loginRequired'));
          else setError(t('redeem.activateFailed'));
        } else {
          setError(t('redeem.networkError'));
        }
        return;
      }

      const amountAdded = Number(data?.amount ?? 0);
      setRedeemResult({ success: true, amount: amountAdded });
      toast.success(t('redeem.activated', { amount: formatPrice(amountAdded) }));
      onSuccess?.(amountAdded);
      setCode('');
    } catch (e) {
      console.error('Redeem error:', e);
      setError(t('redeem.networkError'));
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="w-5 h-5 text-primary" />
          {t('redeem.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {redeemResult?.success ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-success" />
            </div>
            <p className="font-semibold">{t('redeem.activatedTitle')}</p>
            <p className="text-2xl font-bold text-success mt-1">
              +{formatPrice(redeemResult.amount || 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('redeem.addedToWallet')}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setRedeemResult(null)}
            >
              {t('redeem.activateAnother')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>{t('redeem.couponCode')}</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="IBGC-XXXX-XXXX"
                className="mt-1 font-mono uppercase"
              />
              {error && (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            <Button 
              onClick={handleRedeem} 
              disabled={isRedeeming || !code.trim()}
              className="w-full"
            >
              {isRedeeming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('redeem.checking')}
                </>
              ) : (
                <>
                  {t('redeem.activate')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}