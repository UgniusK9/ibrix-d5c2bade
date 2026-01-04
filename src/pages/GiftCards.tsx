import { useState } from 'react';
import { Gift, CreditCard, ArrowRight, Check, Sparkles, Mail, User } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const giftCardAmounts = [
  { value: 25, popular: false },
  { value: 50, popular: true },
  { value: 75, popular: false },
  { value: 100, popular: false },
];

export default function GiftCards() {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'details' | 'payment'>('select');

  const finalAmount = customAmount || selectedAmount;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const handlePurchase = async () => {
    if (!recipientEmail || !recipientName) {
      toast.error('Užpildykite gavėjo informaciją');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: {
          isGiftCard: true,
          giftCardAmount: finalAmount,
          recipientEmail,
          recipientName,
          senderName: senderName || 'Draugas',
          personalMessage,
          email: user?.email || recipientEmail,
          firstName: senderName || 'Pirkėjas',
          lastName: '',
          shippingMethod: 'digital',
          shippingAddress: {},
          items: [],
        },
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success('Dovanų kuponas sėkmingai nupirktas!');
      }
    } catch (e: any) {
      console.error('Purchase error:', e);
      toast.error(e.message || 'Nepavyko apdoroti pirkimo');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PageLayout>
      <SEOHead
        title="Dovanų kuponai | IBRIX"
        description="Nusipirkite IBRIX dovanų kuponą draugui ar šeimos nariui. Idealus pasirinkimas bet kokiai progai."
        canonical="/dovanu-kuponai"
      />

      <div className="container py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-6">
            <Gift className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Dovanų kuponai
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Padovanokite IBRIX patirtį. Idealus pasirinkimas bet kokiai progai – 
            gavėjas galės pasirinkti, ką nori iš mūsų kolekcijos.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {['Suma', 'Informacija', 'Apmokėjimas'].map((label, idx) => {
            const stepNames = ['select', 'details', 'payment'] as const;
            const isActive = stepNames.indexOf(step) >= idx;
            const isCurrent = stepNames[idx] === step;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  isCurrent && "ring-2 ring-primary ring-offset-2"
                )}>
                  {isActive && idx < stepNames.indexOf(step) ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={cn(
                  "text-sm hidden sm:block",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                )}>
                  {label}
                </span>
                {idx < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Select Amount */}
        {step === 'select' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {giftCardAmounts.map(({ value, popular }) => (
                <button
                  key={value}
                  onClick={() => { setSelectedAmount(value); setCustomAmount(null); }}
                  className={cn(
                    "relative p-6 rounded-2xl border-2 transition-all text-center group",
                    selectedAmount === value && !customAmount
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium bg-primary text-primary-foreground px-3 py-1 rounded-full">
                      Populiarus
                    </span>
                  )}
                  <span className="text-3xl font-bold">{value}€</span>
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="bg-card border border-border rounded-xl p-6">
              <Label className="text-base">Arba įveskite kitą sumą</Label>
              <div className="flex gap-3 mt-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    type="number"
                    placeholder="Kita suma"
                    value={customAmount || ''}
                    onChange={(e) => setCustomAmount(Number(e.target.value) || null)}
                    min={5}
                    max={500}
                    className="pl-8"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Min. 5€, max. 500€</p>
            </div>

            <div className="flex justify-end">
              <Button 
                size="lg" 
                onClick={() => setStep('details')}
                disabled={finalAmount < 5}
              >
                Tęsti
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <div className="grid md:grid-cols-[1fr_340px] gap-8">
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Gavėjo informacija
                  </h3>
                  <div>
                    <Label>Gavėjo vardas *</Label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Jonas"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Gavėjo el. paštas *</Label>
                    <Input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="jonas@email.lt"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Kuponas bus išsiųstas į šį adresą
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Jūsų informacija
                  </h3>
                  <div>
                    <Label>Jūsų vardas (neprivaloma)</Label>
                    <Input
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Petras"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Asmeninis pranešimas (neprivaloma)</Label>
                    <Textarea
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value)}
                      placeholder="Su gimtadieniu! Linkiu puikių atradimų..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep('select')}>
                  Grįžti
                </Button>
                <Button 
                  onClick={() => setStep('payment')}
                  disabled={!recipientEmail || !recipientName}
                >
                  Tęsti į apmokėjimą
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="order-first md:order-last">
              <div className="bg-gradient-to-br from-primary/90 to-primary rounded-2xl p-6 text-primary-foreground sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium opacity-90">IBRIX Dovanų kuponas</span>
                </div>
                <p className="text-4xl font-bold mb-2">{formatPrice(finalAmount)}</p>
                {recipientName && (
                  <p className="text-sm opacity-80">Skirta: {recipientName}</p>
                )}
                {senderName && (
                  <p className="text-sm opacity-80 mt-1">Nuo: {senderName}</p>
                )}
                {personalMessage && (
                  <p className="text-sm mt-4 p-3 bg-white/10 rounded-lg italic">
                    "{personalMessage}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 'payment' && (
          <div className="max-w-lg mx-auto space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-heading font-semibold text-lg mb-4">Užsakymo suvestinė</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dovanų kuponas</span>
                    <span className="font-medium">{formatPrice(finalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gavėjas</span>
                    <span>{recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">El. paštas</span>
                    <span>{recipientEmail}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-base font-semibold">
                    <span>Iš viso</span>
                    <span>{formatPrice(finalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-muted/50 p-4 rounded-xl text-sm text-muted-foreground">
              <p>
                Po apmokėjimo, gavėjas gaus el. laišką su dovanų kupono kodu, 
                kurį galės panaudoti bet kuriam IBRIX pirkiniui.
              </p>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('details')}>
                Grįžti
              </Button>
              <Button 
                size="lg"
                className="flex-1"
                onClick={handlePurchase}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  'Apdorojama...'
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Apmokėti {formatPrice(finalAmount)}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {[
            { title: 'Neterminuotas', desc: 'Kuponas galioja neribotą laiką' },
            { title: 'Instant pristatymas', desc: 'Gavėjas gauna iškart el. paštu' },
            { title: 'Lankstus', desc: 'Naudojamas bet kokiam pirkiniui' },
          ].map((item) => (
            <div key={item.title} className="text-center p-6">
              <Check className="w-8 h-8 mx-auto mb-3 text-success" />
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}