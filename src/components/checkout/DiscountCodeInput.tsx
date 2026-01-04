import { useState } from 'react';
import { Loader2, Tag, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppliedDiscount {
  offerId: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  title: string;
}

interface DiscountCodeInputProps {
  cartTotal: number;
  onApply: (discount: AppliedDiscount | null) => void;
  appliedDiscount: AppliedDiscount | null;
}

export function DiscountCodeInput({ cartTotal, onApply, appliedDiscount }: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCode = async () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Call edge function to validate discount code server-side
      const { data, error: fnError } = await supabase.functions.invoke('validate-discount', {
        body: {
          code: code.trim().toUpperCase(),
          cartTotal,
        },
      });

      if (fnError) throw fnError;

      if (data.valid) {
        onApply({
          offerId: data.offer.id,
          code: data.offer.code,
          type: data.offer.type,
          value: data.offer.value,
          title: data.offer.title,
        });
        toast.success(`Nuolaida "${data.offer.title}" pritaikyta!`);
        setCode('');
      } else {
        setError(data.message || 'Netinkamas kodas');
      }
    } catch (e: any) {
      console.error('Discount validation error:', e);
      setError(e.message || 'Klaida tikrinant kodą');
    } finally {
      setIsLoading(false);
    }
  };

  const removeDiscount = () => {
    onApply(null);
    setCode('');
    setError(null);
  };

  const formatDiscount = (discount: AppliedDiscount) => {
    if (discount.type === 'percent') {
      return `-${discount.value}%`;
    }
    return `-${discount.value.toFixed(2)}€`;
  };

  if (appliedDiscount) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-700">{appliedDiscount.title}</p>
            <p className="text-xs text-green-600">
              Kodas: {appliedDiscount.code} • {formatDiscount(appliedDiscount)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={removeDiscount}
          className="h-8 w-8 p-0 text-green-700 hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Nuolaidos kodas"
            className="pl-10"
            onKeyDown={(e) => e.key === 'Enter' && validateCode()}
          />
        </div>
        <Button
          variant="outline"
          onClick={validateCode}
          disabled={isLoading || !code.trim()}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Pritaikyti'
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
