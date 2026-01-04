import { useState } from 'react';
import { Gift, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RedeemGiftCardProps {
  onSuccess?: (amount: number) => void;
}

export function RedeemGiftCard({ onSuccess }: RedeemGiftCardProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; amount?: number } | null>(null);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast.error('Įveskite kupono kodą');
      return;
    }

    if (!user) {
      toast.error('Prisijunkite, kad galėtumėte aktyvuoti kuponą');
      return;
    }

    setIsRedeeming(true);
    try {
      // Find the gift card
      const { data: giftCard, error: findError } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .single();

      if (findError || !giftCard) {
        toast.error('Kuponas nerastas');
        return;
      }

      if (giftCard.status !== 'active') {
        toast.error('Šis kuponas jau panaudotas arba negalioja');
        return;
      }

      if (giftCard.current_balance_eur <= 0) {
        toast.error('Kupono balansas yra 0€');
        return;
      }

      // Check or create wallet
      let wallet = await supabase
        .from('wallets')
        .select('id, balance_eur')
        .eq('user_id', user.id)
        .maybeSingle();

      let walletId: string;
      let currentBalance: number;

      if (!wallet.data) {
        // Create wallet
        const { data: newWallet, error: walletError } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, balance_eur: 0 })
          .select()
          .single();

        if (walletError) throw walletError;
        walletId = newWallet.id;
        currentBalance = 0;
      } else {
        walletId = wallet.data.id;
        currentBalance = wallet.data.balance_eur;
      }

      const amountToAdd = giftCard.current_balance_eur;
      const newBalance = currentBalance + amountToAdd;

      // Update wallet balance
      const { error: updateWalletError } = await supabase
        .from('wallets')
        .update({ balance_eur: newBalance })
        .eq('id', walletId);

      if (updateWalletError) throw updateWalletError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: walletId,
          type: 'gift_card_redeem',
          amount_eur: amountToAdd,
          description: `Dovanų kuponas: ${giftCard.code}`,
          reference_type: 'gift_card',
          reference_id: giftCard.id,
        });

      if (transactionError) throw transactionError;

      // Mark gift card as redeemed
      const { error: redeemError } = await supabase
        .from('gift_cards')
        .update({
          status: 'redeemed',
          current_balance_eur: 0,
          redeemed_at: new Date().toISOString(),
          redeemed_by_user_id: user.id,
        })
        .eq('id', giftCard.id);

      if (redeemError) throw redeemError;

      setRedeemResult({ success: true, amount: amountToAdd });
      toast.success(`Kuponas aktyvuotas! +${formatPrice(amountToAdd)} pridėta į piniginę`);
      onSuccess?.(amountToAdd);
      setCode('');
    } catch (e: any) {
      console.error('Redeem error:', e);
      toast.error(e.message || 'Nepavyko aktyvuoti kupono');
      setRedeemResult({ success: false });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="w-5 h-5 text-primary" />
          Aktyvuoti dovanų kuponą
        </CardTitle>
      </CardHeader>
      <CardContent>
        {redeemResult?.success ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-success" />
            </div>
            <p className="font-semibold">Kuponas aktyvuotas!</p>
            <p className="text-2xl font-bold text-success mt-1">
              +{formatPrice(redeemResult.amount || 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Suma pridėta į jūsų piniginę
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setRedeemResult(null)}
            >
              Aktyvuoti dar vieną
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Kupono kodas</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="IBGC-XXXX-XXXX"
                className="mt-1 font-mono uppercase"
              />
            </div>
            <Button 
              onClick={handleRedeem} 
              disabled={isRedeeming || !code.trim()}
              className="w-full"
            >
              {isRedeeming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Tikrinama...
                </>
              ) : (
                <>
                  Aktyvuoti
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