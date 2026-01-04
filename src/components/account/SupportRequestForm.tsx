import { useState } from 'react';
import { HelpCircle, Package, AlertTriangle, MessageSquare, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SupportRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
}

const requestTypes = [
  { 
    id: 'return', 
    label: 'Prekės grąžinimas', 
    icon: Package,
    description: 'Noriu grąžinti prekę ir atgauti pinigus'
  },
  { 
    id: 'missing_parts', 
    label: 'Trūkstamos detalės', 
    icon: AlertTriangle,
    description: 'Gavau prekę be kai kurių dalių'
  },
  { 
    id: 'other', 
    label: 'Kita informacija', 
    icon: MessageSquare,
    description: 'Turiu kitą klausimą apie užsakymą'
  },
];

export function SupportRequestForm({ isOpen, onClose, orderId, orderNumber }: SupportRequestFormProps) {
  const { user } = useAuth();
  const [requestType, setRequestType] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!requestType) {
      toast.error('Pasirinkite užklausos tipą');
      return;
    }

    if (!message.trim()) {
      toast.error('Įveskite pranešimą');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send email to admin
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'support_request',
          data: {
            orderId,
            orderNumber,
            requestType,
            message,
            userEmail: user?.email,
          },
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Užklausa išsiųsta sėkmingai');
    } catch (e: any) {
      console.error('Support request error:', e);
      toast.error(e.message || 'Nepavyko išsiųsti užklausos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setRequestType('');
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Turiu klausimą
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Užklausa priimta!</h3>
            <p className="text-muted-foreground text-sm">
              Mūsų komanda peržiūrės jūsų užklausą ir susisieks su jumis el. paštu per 1-2 darbo dienas.
            </p>
            <Button onClick={handleClose} className="mt-6">
              Uždaryti
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            <div className="text-sm text-muted-foreground">
              Užsakymas: <span className="font-mono font-medium text-foreground">{orderNumber}</span>
            </div>

            <div className="space-y-3">
              <Label>Pasirinkite temą</Label>
              <RadioGroup value={requestType} onValueChange={setRequestType}>
                {requestTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label
                      key={type.id}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                        requestType === type.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <RadioGroupItem value={type.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{type.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Jūsų pranešimas</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Aprašykite savo situaciją..."
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Atšaukti
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !requestType || !message.trim()}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Siunčiama...
                  </>
                ) : (
                  'Siųsti'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}