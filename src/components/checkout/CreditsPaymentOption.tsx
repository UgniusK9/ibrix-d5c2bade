import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Sparkles, AlertCircle, Check } from 'lucide-react';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CreditsPaymentOptionProps {
  cartItems: Array<{
    productId: string;
    quantity: number;
    price: number;
    title: string;
  }>;
  selected: boolean;
  onSelect: () => void;
  onCreditsInfo: (info: CreditsInfo | null) => void;
}

export interface CreditsInfo {
  canPayWithCredits: boolean;
  totalCreditsRequired: number;
  userBalance: number;
  missingCredits: number;
  eligibleItems: Array<{
    productId: string;
    title: string;
    creditsRequired: number;
  }>;
}

export function CreditsPaymentOption({ 
  cartItems, 
  selected, 
  onSelect,
  onCreditsInfo 
}: CreditsPaymentOptionProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creditsInfo, setCreditsInfo] = useState<CreditsInfo | null>(null);

  useEffect(() => {
    const loadCreditsData = async () => {
      if (!user) {
        setLoading(false);
        onCreditsInfo(null);
        return;
      }

      try {
        // Load wallet balance
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance_eur')
          .eq('user_id', user.id)
          .maybeSingle();

        const userBalance = walletData?.balance_eur || 0;

        // Load products with credits_cost_eur
        const productIds = cartItems.map(item => item.productId);
        const { data: products } = await supabase
          .from('products')
          .select('id, title, credits_cost_eur')
          .in('id', productIds)
          .not('credits_cost_eur', 'is', null)
          .gt('credits_cost_eur', 0);

        // Build eligible items list
        const eligibleItems: CreditsInfo['eligibleItems'] = [];
        let totalCreditsRequired = 0;

        cartItems.forEach(cartItem => {
          const product = products?.find(p => p.id === cartItem.productId);
          if (product && product.credits_cost_eur) {
            const creditsForItem = product.credits_cost_eur * cartItem.quantity;
            eligibleItems.push({
              productId: cartItem.productId,
              title: product.title,
              creditsRequired: creditsForItem,
            });
            totalCreditsRequired += creditsForItem;
          }
        });

        // All items must be eligible for credits payment
        const allItemsEligible = eligibleItems.length === cartItems.length;
        const hasEnoughCredits = userBalance >= totalCreditsRequired;
        const canPayWithCredits = allItemsEligible && hasEnoughCredits && totalCreditsRequired > 0;

        const info: CreditsInfo = {
          canPayWithCredits,
          totalCreditsRequired,
          userBalance,
          missingCredits: Math.max(0, totalCreditsRequired - userBalance),
          eligibleItems,
        };

        setCreditsInfo(info);
        onCreditsInfo(info);
      } catch (err) {
        console.error('Error loading credits data:', err);
        onCreditsInfo(null);
      } finally {
        setLoading(false);
      }
    };

    loadCreditsData();
  }, [user, cartItems, onCreditsInfo]);

  // Not logged in - don't show option
  if (!user) {
    return null;
  }

  // Still loading
  if (loading) {
    return (
      <div className="p-4 border border-border rounded-lg animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3"></div>
      </div>
    );
  }

  // No eligible items
  if (!creditsInfo || creditsInfo.eligibleItems.length === 0) {
    return null;
  }

  // Not all items are eligible
  if (creditsInfo.eligibleItems.length !== cartItems.length) {
    return (
      <div className="p-4 border border-border rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Wallet className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Mokėti kreditais</p>
            <p className="text-xs text-muted-foreground">
              Tik dalis prekių gali būti apmokėtos kreditais
            </p>
          </div>
        </div>
      </div>
    );
  }

  const canSelect = creditsInfo.canPayWithCredits;

  return (
    <label
      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : canSelect
            ? 'border-border hover:bg-muted/50'
            : 'border-border bg-muted/30 cursor-not-allowed opacity-60'
      }`}
      onClick={(e) => {
        if (!canSelect) {
          e.preventDefault();
        }
      }}
    >
      <RadioGroupItem 
        value="credits" 
        disabled={!canSelect}
        checked={selected}
        onClick={() => canSelect && onSelect()}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium">Mokėti kreditais</span>
          {canSelect && (
            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">
              <Check className="w-3 h-3 mr-1" />
              Galite apmokėti
            </Badge>
          )}
        </div>
        
        <div className="ml-10 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Reikalinga kreditų:</span>
            <span className="font-semibold">{creditsInfo.totalCreditsRequired}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Jūsų balansas:</span>
            <span className={creditsInfo.userBalance >= creditsInfo.totalCreditsRequired ? 'text-green-600 font-semibold' : 'text-muted-foreground'}>
              {creditsInfo.userBalance.toFixed(2)}
            </span>
          </div>
          
          {!canSelect && creditsInfo.missingCredits > 0 && (
            <div className="flex items-center gap-1 text-destructive text-sm mt-2">
              <AlertCircle className="w-4 h-4" />
              <span>Trūksta {creditsInfo.missingCredits.toFixed(0)} kreditų</span>
            </div>
          )}
          
          {selected && canSelect && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                ✓ Bus panaudota: {creditsInfo.totalCreditsRequired} kreditų
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Liks: {(creditsInfo.userBalance - creditsInfo.totalCreditsRequired).toFixed(2)} kreditų
              </p>
            </div>
          )}
        </div>
      </div>
    </label>
  );
}
