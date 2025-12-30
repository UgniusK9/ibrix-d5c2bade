import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Package, Clock, Truck, MapPin, Loader2, AlertCircle, CreditCard } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore, formatCartPrice } from "@/stores/cartStore";
import { toast } from "sonner";
import { z } from "zod";

const shippingMethods = [
  { id: 'omniva_locker', name: 'Omniva paštomatas', price: 0, eta: '1–2 d.d.' },
  { id: 'lp_express_locker', name: 'LP EXPRESS paštomatas', price: 0, eta: '1–2 d.d.' },
  { id: 'dpd_locker', name: 'DPD paštomatas', price: 0, eta: '1–3 d.d.' },
  { id: 'courier', name: 'Kurjeris į namus', price: 499, eta: '1–3 d.d.' },
] as const;

type ShippingMethod = typeof shippingMethods[number]['id'];

const checkoutSchema = z.object({
  firstName: z.string().min(2, "Vardas per trumpas").max(50),
  lastName: z.string().min(2, "Pavardė per trumpa").max(50),
  email: z.string().email("Neteisingas el. pašto formatas"),
  phone: z.string().optional(),
  shippingMethod: z.enum(['omniva_locker', 'lp_express_locker', 'dpd_locker', 'courier']),
  lockerAddress: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
});

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPriceCents, clearCart, getSessionId } = useCartStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    shippingMethod: 'omniva_locker' as ShippingMethod,
    lockerAddress: '',
    street: '',
    city: '',
    postalCode: '',
    notes: '',
  });

  const selectedShipping = shippingMethods.find(m => m.id === formData.shippingMethod)!;
  const subtotalCents = getTotalPriceCents();
  const shippingCents = selectedShipping.price;
  const totalCents = subtotalCents + shippingCents;
  
  const hasPreorder = items.some(item => item.type === 'pre_order');
  const maxEta = items.reduce((max, item) => {
    if (item.type === 'pre_order' && item.eta) {
      const weeks = parseInt(item.eta.split('–')[1] || item.eta);
      return Math.max(max, weeks);
    }
    return max;
  }, 0);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const result = checkoutSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Check if courier needs address
    if (formData.shippingMethod === 'courier') {
      if (!formData.street || !formData.city || !formData.postalCode) {
        setErrors({
          street: !formData.street ? 'Privalomas laukas' : '',
          city: !formData.city ? 'Privalomas laukas' : '',
          postalCode: !formData.postalCode ? 'Privalomas laukas' : '',
        });
        return;
      }
    } else {
      if (!formData.lockerAddress) {
        setErrors({ lockerAddress: 'Pasirinkite paštomatą' });
        return;
      }
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId(),
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          shippingMethod: formData.shippingMethod,
          shippingAddress: formData.shippingMethod === 'courier' 
            ? {
                street: formData.street,
                city: formData.city,
                postalCode: formData.postalCode,
                country: 'LT',
              }
            : {
                lockerAddress: formData.lockerAddress,
              },
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Nepavyko sukurti užsakymo');
      }

      // Success - redirect to confirmation page
      clearCart();
      navigate(`/uzsakymas?order=${data.order.orderNumber}`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error("Klaida", {
        description: error instanceof Error ? error.message : 'Nepavyko sukurti užsakymo',
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty cart
  if (items.length === 0) {
    return (
      <PageLayout>
        <div className="container py-16 max-w-lg mx-auto text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">
            Krepšelis tuščias
          </h1>
          <p className="text-muted-foreground mb-6">
            Pridėkite prekių prieš pereinant į apmokėjimą.
          </p>
          <Button asChild>
            <Link to="/varikliai">Peržiūrėti variklius</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-8 md:py-12">
        <Link 
          to="/varikliai" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tęsti apsipirkimą
        </Link>

        <h1 className="font-heading text-3xl font-bold mb-8">Apmokėjimas</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column - Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact info */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-heading text-lg font-semibold mb-4">Kontaktinė informacija</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Vardas *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={errors.firstName ? 'border-destructive' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Pavardė *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={errors.lastName ? 'border-destructive' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">El. paštas *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefonas</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+370..."
                    />
                  </div>
                </div>
              </div>

              {/* Shipping method */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-heading text-lg font-semibold mb-4">Pristatymo būdas</h2>
                <RadioGroup
                  value={formData.shippingMethod}
                  onValueChange={(value) => handleInputChange('shippingMethod', value)}
                  className="space-y-3"
                >
                  {shippingMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                        formData.shippingMethod === method.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleInputChange('shippingMethod', method.id)}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <div>
                          <Label htmlFor={method.id} className="cursor-pointer font-medium">
                            {method.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">{method.eta}</p>
                        </div>
                      </div>
                      <span className="font-medium">
                        {method.price === 0 ? 'Nemokama' : formatCartPrice(method.price, 'EUR')}
                      </span>
                    </div>
                  ))}
                </RadioGroup>

                {/* Shipping address */}
                <div className="mt-6">
                  {formData.shippingMethod !== 'courier' ? (
                    <div>
                      <Label htmlFor="lockerAddress">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Paštomato adresas *
                      </Label>
                      <Input
                        id="lockerAddress"
                        value={formData.lockerAddress}
                        onChange={(e) => handleInputChange('lockerAddress', e.target.value)}
                        placeholder="Įveskite paštomato adresą ar pavadinimą"
                        className={errors.lockerAddress ? 'border-destructive mt-2' : 'mt-2'}
                      />
                      {errors.lockerAddress && (
                        <p className="text-xs text-destructive mt-1">{errors.lockerAddress}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Pvz.: Vilnius, Pilaitės pr. 16
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="street">Gatvė, namo nr. *</Label>
                        <Input
                          id="street"
                          value={formData.street}
                          onChange={(e) => handleInputChange('street', e.target.value)}
                          className={errors.street ? 'border-destructive' : ''}
                        />
                        {errors.street && (
                          <p className="text-xs text-destructive mt-1">{errors.street}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">Miestas *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className={errors.city ? 'border-destructive' : ''}
                          />
                          {errors.city && (
                            <p className="text-xs text-destructive mt-1">{errors.city}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="postalCode">Pašto kodas *</Label>
                          <Input
                            id="postalCode"
                            value={formData.postalCode}
                            onChange={(e) => handleInputChange('postalCode', e.target.value)}
                            placeholder="LT-00000"
                            className={errors.postalCode ? 'border-destructive' : ''}
                          />
                          {errors.postalCode && (
                            <p className="text-xs text-destructive mt-1">{errors.postalCode}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-heading text-lg font-semibold mb-4">Pastabos</h2>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Papildomos pastabos užsakymui (nebūtina)"
                  rows={3}
                />
              </div>

              {/* Payment info notice */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Mokėjimai dar neprijungti</p>
                  <p className="text-sm text-muted-foreground">
                    Sukūrus užsakymą, susisieksime su jumis dėl apmokėjimo. Greitai pridėsime Stripe mokėjimus.
                  </p>
                </div>
              </div>
            </div>

            {/* Right column - Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                <h2 className="font-heading text-lg font-semibold mb-4">Užsakymo suvestinė</h2>
                
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${item.type === 'pre_order' ? 'border-primary/50 text-primary' : 'border-success/50 text-success'}`}
                          >
                            {item.type === 'pre_order' ? 'Pre-order' : 'Sandėlyje'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">Kiekis: {item.quantity}</span>
                          <span className="text-sm font-medium">
                            {formatCartPrice(item.priceCents * item.quantity, item.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {hasPreorder && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pre-order prekės bus pristatytos per {maxEta} sav.
                    </p>
                  </div>
                )}

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tarpinė suma</span>
                    <span>{formatCartPrice(subtotalCents, 'EUR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pristatymas</span>
                    <span>{shippingCents === 0 ? 'Nemokama' : formatCartPrice(shippingCents, 'EUR')}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>Viso</span>
                    <span className="font-heading">{formatCartPrice(totalCents, 'EUR')}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-6 bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kuriamas užsakymas...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pateikti užsakymą
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Pateikdami užsakymą sutinkate su{' '}
                  <Link to="/taisykles" className="text-primary hover:underline">
                    taisyklėmis
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
