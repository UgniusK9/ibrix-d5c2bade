import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Package, ChevronLeft, CreditCard, MapPin, Truck, Wallet } from "lucide-react";
import { CartRecommendations } from "@/components/cart/CartRecommendations";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useCartStore, formatCartPrice } from "@/stores/cartStore";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackBeginCheckoutEvent, trackAddPaymentInfoEvent } from "@/hooks/useAnalytics";
import { DiscountCodeInput, AppliedDiscount } from "@/components/checkout/DiscountCodeInput";
import { InvoiceFields } from "@/components/checkout/InvoiceFields";
import { LockerSearch } from "@/components/checkout/LockerSearch";
import { PhoneInput } from "@/components/checkout/PhoneInput";
import { PaymentMethodSelector, PaymentMethod, PAYMENT_METHODS } from "@/components/checkout/PaymentMethodSelector";
import { type LockerTerminal } from "@/data/lockerTerminals";

const checkoutSchema = z.object({
  firstName: z.string().min(1, "Vardas privalomas").max(50),
  lastName: z.string().min(1, "Pavardė privaloma").max(50),
  email: z.string().email("Neteisingas el. pašto adresas"),
  phone: z.string().optional().or(z.literal("")),
  shippingMethod: z.enum(["omniva_locker", "lp_express_locker", "dpd_locker", "courier"]),
  lockerAddress: z.string().optional(),
  lockerId: z.string().optional(),
  lockerCity: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  invoiceCompanyName: z.string().optional(),
  invoiceVatCode: z.string().optional(),
  invoiceAddress: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const shippingMethods = [
  { id: "omniva_locker", label: "Omniva paštomatas", price: 0, icon: Package },
  { id: "lp_express_locker", label: "LP EXPRESS paštomatas", price: 0, icon: Package },
  { id: "dpd_locker", label: "DPD paštomatas", price: 0, icon: Package },
  { id: "courier", label: "Kurjeris į namus", price: 4.99, icon: Truck },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<LockerTerminal | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(true);
  const [phoneValue, setPhoneValue] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(
    PAYMENT_METHODS.find(m => m.enabled) || null
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingMethod: "omniva_locker",
    },
  });

  const shippingMethod = watch("shippingMethod");
  const isLockerMethod = shippingMethod?.includes("locker");

  // Check if cart has any preorder items
  const hasPreorderItems = items.some(item => item.status === 'preorder');

  // Calculate amounts based on stock status
  const calculateAmounts = () => {
    let immediatePayment = 0;
    let laterPayment = 0;

    items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      if (item.status === 'in_stock') {
        immediatePayment += itemTotal;
      } else {
        const itemDeposit = item.deposit * item.quantity;
        immediatePayment += itemDeposit;
        laterPayment += itemTotal - itemDeposit;
      }
    });

    return { immediatePayment, laterPayment };
  };

  const { immediatePayment, laterPayment } = calculateAmounts();

  const fullTotal = getTotalPrice();
  const selectedShippingMethod = shippingMethods.find(m => m.id === shippingMethod);
  const shippingPrice = (selectedShippingMethod?.price || 0) * 100;

  const discountAmount = appliedDiscount 
    ? (appliedDiscount.type === 'percent' 
      ? (immediatePayment * appliedDiscount.value / 100)
      : Math.min(appliedDiscount.value * 100, immediatePayment))
    : 0;
  
  const walletDeduction = useWallet ? Math.min(walletBalance * 100, immediatePayment - discountAmount) : 0;
  const finalImmediatePayment = Math.max(0, immediatePayment - discountAmount - walletDeduction) + shippingPrice;

  useEffect(() => {
    if (items.length === 0) {
      navigate("/produktai/visi");
    }
  }, [items, navigate]);

  useEffect(() => {
    const loadWallet = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('wallets')
        .select('balance_eur')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setWalletBalance(data.balance_eur);
      }
    };
    
    loadWallet();
  }, [user]);

  useEffect(() => {
    if (items.length > 0) {
      trackBeginCheckoutEvent({
        totalCents: finalImmediatePayment,
        currency: "EUR",
        items: items.map(item => ({
          id: item.productId,
          name: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
      });
    }
  }, []);

  const onSubmit = async (data: CheckoutFormData) => {
    if (step === 1) {
      if (isLockerMethod && !selectedLocker) {
        toast.error("Pasirinkite paštomatą");
        return;
      }
      if (data.shippingMethod === 'courier' && (!data.street || !data.city || !data.postalCode)) {
        toast.error("Užpildykite visą pristatymo adresą");
        return;
      }
      setStep(2);
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Pasirinkite mokėjimo būdą");
      return;
    }

    setIsLoading(true);

    trackAddPaymentInfoEvent({
      totalCents: finalImmediatePayment,
      currency: "EUR",
      items: items.map(item => ({
        id: item.productId,
        name: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
    });

    try {
      const checkoutItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId || undefined,
      }));

      // For Stripe payments, use the existing checkout flow
      if (selectedPaymentMethod.provider === 'stripe') {
        const { data: result, error } = await supabase.functions.invoke("checkout", {
          body: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: phoneValue || undefined,
            shippingMethod: data.shippingMethod,
            shippingAddress: selectedLocker ? {
              lockerId: selectedLocker.id,
              lockerName: selectedLocker.name,
              lockerAddress: `${selectedLocker.address}, ${selectedLocker.city}`,
              lockerCity: selectedLocker.city,
              lockerPostalCode: selectedLocker.postalCode,
              lat: selectedLocker.lat,
              lng: selectedLocker.lng,
            } : {
              street: data.street,
              city: data.city,
              postalCode: data.postalCode,
            },
            notes: data.notes,
            items: checkoutItems,
            discountCode: appliedDiscount?.code,
            wantsInvoice: wantsInvoice,
            invoiceCompanyName: data.invoiceCompanyName,
            invoiceVatCode: data.invoiceVatCode,
            invoiceAddress: data.invoiceAddress,
            invoiceCountry: "Lietuva",
            useWalletBalance: useWallet && walletBalance > 0,
            walletDeductionCents: walletDeduction,
            paymentProvider: 'stripe',
            paymentMethodCode: selectedPaymentMethod.code,
          },
        });

        if (error) throw error;

        if (result?.checkoutUrl) {
          clearCart();
          window.location.href = result.checkoutUrl;
        } else {
          throw new Error("Nepavyko sukurti apmokėjimo sesijos");
        }
      } else if (selectedPaymentMethod.provider === 'paysera') {
        // For Paysera, first create order then redirect to Paysera
        const { data: result, error } = await supabase.functions.invoke("checkout", {
          body: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: phoneValue || undefined,
            shippingMethod: data.shippingMethod,
            shippingAddress: selectedLocker ? {
              lockerId: selectedLocker.id,
              lockerName: selectedLocker.name,
              lockerAddress: `${selectedLocker.address}, ${selectedLocker.city}`,
              lockerCity: selectedLocker.city,
              lockerPostalCode: selectedLocker.postalCode,
              lat: selectedLocker.lat,
              lng: selectedLocker.lng,
            } : {
              street: data.street,
              city: data.city,
              postalCode: data.postalCode,
            },
            notes: data.notes,
            items: checkoutItems,
            discountCode: appliedDiscount?.code,
            wantsInvoice: wantsInvoice,
            invoiceCompanyName: data.invoiceCompanyName,
            invoiceVatCode: data.invoiceVatCode,
            invoiceAddress: data.invoiceAddress,
            invoiceCountry: "Lietuva",
            useWalletBalance: useWallet && walletBalance > 0,
            walletDeductionCents: walletDeduction,
            paymentProvider: 'paysera',
            paymentMethodCode: selectedPaymentMethod.code,
            skipStripe: true, // Flag to skip Stripe session creation
          },
        });

        if (error) throw error;

        // Now call Paysera payment creation
        const { data: payseraResult, error: payseraError } = await supabase.functions.invoke("create-paysera-payment", {
          body: {
            orderId: result.order.id,
            paymentType: hasPreorderItems ? 'deposit' : 'full',
            bankCode: selectedPaymentMethod.bankCode,
          },
        });

        if (payseraError) throw payseraError;

        if (payseraResult?.redirectUrl) {
          clearCart();
          window.location.href = payseraResult.redirectUrl;
        } else {
          throw new Error("Nepavyko sukurti Paysera mokėjimo");
        }
      } else if (selectedPaymentMethod.provider === 'paypal') {
        toast.error("PayPal mokėjimai bus prieinami greitai");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Klaida apdorojant užsakymą");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <PageLayout>
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => (step === 2 ? setStep(1) : navigate(-1))}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {step === 2 ? "Grįžti" : "Atgal"}
          </Button>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">
            {step === 1 ? "Pristatymo informacija" : "Mokėjimas"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Žingsnis {step} iš 2
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <>
                {/* Contact Info */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Kontaktinė informacija
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Vardas *</Label>
                      <Input {...register("firstName")} id="firstName" />
                      {errors.firstName && (
                        <p className="text-destructive text-sm mt-1">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Pavardė *</Label>
                      <Input {...register("lastName")} id="lastName" />
                      {errors.lastName && (
                        <p className="text-destructive text-sm mt-1">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">El. paštas *</Label>
                    <Input {...register("email")} id="email" type="email" />
                    {errors.email && (
                      <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefonas</Label>
                    <PhoneInput
                      value={phoneValue}
                      onChange={setPhoneValue}
                    />
                  </div>
                </div>

                {/* Shipping Method */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Pristatymo būdas
                  </h2>
                  <RadioGroup
                    value={shippingMethod}
                    onValueChange={(value) => setValue("shippingMethod", value as any)}
                  >
                    {shippingMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <label
                          key={method.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                            shippingMethod === method.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <RadioGroupItem value={method.id} />
                          <Icon className="w-5 h-5 text-muted-foreground" />
                          <span className="flex-1">{method.label}</span>
                          <span className="text-sm text-muted-foreground">
                            {method.price === 0 ? "Nemokamas" : `${method.price}€`}
                          </span>
                        </label>
                      );
                    })}
                  </RadioGroup>

                  {isLockerMethod && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                      <LockerSearch
                        shippingMethod={shippingMethod}
                        selectedLocker={selectedLocker}
                        onSelect={setSelectedLocker}
                      />
                    </div>
                  )}

                  {shippingMethod === "courier" && (
                    <div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label htmlFor="street">Gatvė, namo nr. *</Label>
                        <Input {...register("street")} id="street" />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">Miestas *</Label>
                          <Input {...register("city")} id="city" />
                        </div>
                        <div>
                          <Label htmlFor="postalCode">Pašto kodas *</Label>
                          <Input {...register("postalCode")} id="postalCode" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <Label htmlFor="notes">Pastabos (neprivaloma)</Label>
                  <Textarea
                    {...register("notes")}
                    id="notes"
                    placeholder="Papildoma informacija apie pristatymą..."
                    className="mt-2"
                  />
                </div>

                {/* Discount Code */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <DiscountCodeInput
                    cartTotal={fullTotal}
                    onApply={setAppliedDiscount}
                    appliedDiscount={appliedDiscount}
                  />
                </div>

                {/* Wallet Balance */}
                {user && walletBalance > 0 && (
                  <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="font-semibold">Piniginės balansas</p>
                          <p className="text-sm text-muted-foreground">
                            Turimas likutis: {formatCartPrice(walletBalance * 100)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="use-wallet" className="text-sm">Naudoti</Label>
                        <Switch
                          id="use-wallet"
                          checked={useWallet}
                          onCheckedChange={setUseWallet}
                        />
                      </div>
                    </div>
                    {useWallet && walletDeduction > 0 && (
                      <p className="text-sm text-success mt-3">
                        Bus panaudota: -{formatCartPrice(walletDeduction)}
                      </p>
                    )}
                  </div>
                )}

                {/* Invoice Fields */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <InvoiceFields
                    register={register}
                    errors={errors}
                    wantsInvoice={wantsInvoice}
                    onWantsInvoiceChange={setWantsInvoice}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pasirinkite mokėjimo būdą
                </h2>
                
                <PaymentMethodSelector
                  selectedMethod={selectedPaymentMethod?.id || null}
                  onSelect={setSelectedPaymentMethod}
                />

                {laterPayment > 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Likusi suma ({formatCartPrice(laterPayment)}) bus apmokėta vėliau, prieš siunčiant užsakymą.
                  </p>
                )}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isLoading || (step === 2 && !selectedPaymentMethod)}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Apdorojama...
                </>
              ) : step === 1 ? (
                "Tęsti į mokėjimą"
              ) : (
                `Apmokėti ${formatCartPrice(finalImmediatePayment)}`
              )}
            </Button>
          </form>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-lg mb-4">Užsakymo suvestinė</h2>
              
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Kiekis: {item.quantity}
                      </p>
                      <p className="text-sm font-medium">
                        {formatCartPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prekės</span>
                  <span>{formatCartPrice(fullTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pristatymas</span>
                  <span className={shippingPrice === 0 ? "text-green-600" : ""}>
                    {shippingPrice === 0 ? "Nemokamas" : formatCartPrice(shippingPrice)}
                  </span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Nuolaida ({appliedDiscount.code})</span>
                    <span>-{formatCartPrice(discountAmount)}</span>
                  </div>
                )}
                {useWallet && walletDeduction > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Piniginė</span>
                    <span>-{formatCartPrice(walletDeduction)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-primary pt-2 border-t border-dashed">
                  <span>{laterPayment > 0 ? "Mokėsite dabar" : "Iš viso"}</span>
                  <span>{formatCartPrice(finalImmediatePayment)}</span>
                </div>
                {laterPayment > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Likusi suma (vėliau)</span>
                    <span>{formatCartPrice(laterPayment)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations at bottom */}
        {step === 1 && (
          <div className="mt-8">
            <CartRecommendations maxItems={4} title="Kiti galimi produktai" />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
