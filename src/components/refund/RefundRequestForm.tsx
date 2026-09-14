import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RefundRequestFormProps {
  orderId: string;
  orderNumber: string;
  maxAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RefundRequestForm({
  orderId,
  orderNumber,
  maxAmount,
  isOpen,
  onClose,
  onSuccess,
}: RefundRequestFormProps) {
  const { t } = useTranslation();
  const REFUND_REASONS = [
    { value: 'defective', label: t('refund.reasonDefective') },
    { value: 'not_as_described', label: t('refund.reasonNotAsDescribed') },
    { value: 'wrong_item', label: t('refund.reasonWrongItem') },
    { value: 'changed_mind', label: t('refund.reasonChangedMind') },
    { value: 'other', label: t('refund.reasonOther') },
  ];
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error(t('refund.selectReason'));
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error(t('refund.loginRequired'));
        return;
      }

      const { error } = await supabase.from('refunds').insert({
        order_id: orderId,
        user_id: session.user.id,
        reason: REFUND_REASONS.find(r => r.value === reason)?.label || reason,
        customer_notes: notes.trim() || null,
        amount_eur: maxAmount,
        is_full_refund: true,
        status: 'requested',
      });

      if (error) throw error;

      toast.success(t('refund.submitted'));
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Refund request error:', error);
      toast.error(error.message || t('refund.submitFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('refund.title')}</DialogTitle>
          <DialogDescription>
            {t('refund.order')} {orderNumber} • {t('refund.amount')}: {maxAmount.toFixed(2)}€
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-base">{t('refund.reason')} *</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="mt-2">
              {REFUND_REASONS.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={r.value} />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="notes">{t('refund.additionalInfo')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('refund.descPlaceholder')}
              className="mt-2"
              rows={3}
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-700">
              {t('refund.reviewNote')}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !reason} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.sending')}
                </>
              ) : (
                t('refund.submit')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
