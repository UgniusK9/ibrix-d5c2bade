import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Check, X, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Refund {
  id: string;
  order_id: string;
  status: string;
  reason: string;
  customer_notes: string | null;
  admin_notes: string | null;
  amount_eur: number;
  is_full_refund: boolean;
  stripe_refund_id: string | null;
  requested_at: string;
  processed_at: string | null;
  order?: {
    order_number: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export function RefundsManager() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ refund: Refund; action: 'approve' | 'reject' } | null>(null);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('refunds')
        .select(`
          *,
          order:orders (
            order_number,
            email,
            first_name,
            last_name
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRefunds(data || []);
    } catch (error: any) {
      console.error('Error loading refunds:', error);
      toast.error('Klaida kraunant grąžinimus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, []);

  const handleProcess = async (refund: Refund, action: 'approve' | 'reject') => {
    setProcessingId(refund.id);
    
    try {
      if (action === 'approve') {
        // Call edge function to process Stripe refund
        const { data, error } = await supabase.functions.invoke('admin', {
          body: {
            action: 'process_refund',
            refundId: refund.id,
            adminNotes: adminNotes.trim() || null,
          },
        });

        if (error) throw error;
        
        toast.success(`Grąžinimas apdorotas: ${data.stripeRefundId || 'OK'}`);
      } else {
        // Just update status to rejected
        const { error } = await supabase
          .from('refunds')
          .update({
            status: 'rejected',
            admin_notes: adminNotes.trim() || null,
            processed_at: new Date().toISOString(),
          })
          .eq('id', refund.id);

        if (error) throw error;
        
        toast.success('Grąžinimas atmestas');
      }

      setConfirmAction(null);
      setSelectedRefund(null);
      setAdminNotes('');
      loadRefunds();
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast.error(error.message || 'Klaida apdorojant grąžinimą');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      'requested': { label: 'Laukia', className: 'bg-yellow-500/10 text-yellow-600' },
      'approved': { label: 'Patvirtintas', className: 'bg-blue-500/10 text-blue-600' },
      'rejected': { label: 'Atmestas', className: 'bg-destructive/10 text-destructive' },
      'processing': { label: 'Apdorojamas', className: 'bg-purple-500/10 text-purple-600' },
      'refunded': { label: 'Grąžinta', className: 'bg-green-500/10 text-green-600' },
    };
    const c = config[status] || config['requested'];
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Grąžinimai</h2>
        <Button variant="outline" size="sm" onClick={loadRefunds}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atnaujinti
        </Button>
      </div>

      {refunds.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Grąžinimų prašymų nėra
        </div>
      ) : (
        <div className="space-y-3">
          {refunds.map((refund) => (
            <div
              key={refund.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono font-semibold">{refund.order?.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {refund.order?.first_name} {refund.order?.last_name} • {refund.order?.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(refund.status)}
                  <span className="font-semibold">{refund.amount_eur.toFixed(2)}€</span>
                </div>
              </div>

              <div className="text-sm space-y-1 mb-3">
                <p><span className="text-muted-foreground">Priežastis:</span> {refund.reason}</p>
                {refund.customer_notes && (
                  <p><span className="text-muted-foreground">Pastabos:</span> {refund.customer_notes}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Prašyta: {new Date(refund.requested_at).toLocaleString('lt-LT')}
                </p>
              </div>

              {refund.status === 'requested' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => {
                      setSelectedRefund(refund);
                      setConfirmAction({ refund, action: 'reject' });
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Atmesti
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedRefund(refund);
                      setConfirmAction({ refund, action: 'approve' });
                    }}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Patvirtinti ir grąžinti
                  </Button>
                </div>
              )}

              {refund.stripe_refund_id && (
                <p className="text-xs text-muted-foreground mt-2">
                  <CreditCard className="w-3 h-3 inline mr-1" />
                  Stripe: {refund.stripe_refund_id}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === 'approve' ? 'Patvirtinti grąžinimą?' : 'Atmesti grąžinimą?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'approve' ? (
                <>
                  Suma <strong>{confirmAction.refund.amount_eur.toFixed(2)}€</strong> bus grąžinta per Stripe.
                  Šis veiksmas negrįžtamas.
                </>
              ) : (
                'Klientas bus informuotas, kad grąžinimas atmestas.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-2">
            <Textarea
              placeholder="Admin pastabos (neprivaloma)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!processingId}>Atšaukti</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && handleProcess(confirmAction.refund, confirmAction.action)}
              disabled={!!processingId}
              className={confirmAction?.action === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {processingId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : confirmAction?.action === 'approve' ? (
                'Grąžinti pinigus'
              ) : (
                'Atmesti'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
