import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Package, ChevronLeft, CreditCard, MapPin, Truck } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore, formatCartPrice } from "@/stores/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackBeginCheckoutEvent, trackAddPaymentInfoEvent } from "@/hooks/useAnalytics";
import { DiscountCodeInput, AppliedDiscount } from "@/components/checkout/DiscountCodeInput";
import { InvoiceFields } from "@/components/checkout/InvoiceFields";

const checkoutSchema = z.object({
  firstName: z.string().min(1, "Vardas privalomas").max(50),
  lastName: z.string().min(1, "Pavardė privaloma").max(50),
  email: z.string().email("Neteisingas el. pašto adresas"),
  phone: z.string().regex(/^\+?[0-9\s\-]{8,20}$/, "Neteisingas telefono numeris").optional().or(z.literal("")),
  shippingMethod: z.enum(["omniva_locker", "lp_express_locker", "dpd_locker", "courier"]),
  lockerAddress: z.string().optional(),
  lockerId: z.string().optional(),
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
  { id: "courier", label: "Kurjeris", price: 0, icon: Truck },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, getTotalDeposit, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [wantsInvoice, setWantsInvoice] = useState(false);

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

  // Calculate deposit total from cart items
  const baseDepositTotal = getTotalDeposit();
  const fullTotal = getTotalPrice();
  // Calculate discount amount based on type
  const discountAmount = appliedDiscount 
    ? (appliedDiscount.type === 'percent' 
      ? (baseDepositTotal * appliedDiscount.value / 100)
      : appliedDiscount.value)
    : 0;
  const depositTotal = Math.max(0, baseDepositTotal - discountAmount);
  const balanceTotal = fullTotal - baseDepositTotal;

  useEffect(() => {
    if (items.length === 0) {
      navigate("/varikliai");
    }
  }, [items, navigate]);

  useEffect(() => {
    // Track begin checkout when page loads
    if (items.length > 0) {
      trackBeginCheckoutEvent({
        totalCents: depositTotal,
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
      setStep(2);
      return;
    }

    setIsLoading(true);

    // Track add payment info
    trackAddPaymentInfoEvent({
      totalCents: depositTotal,
      currency: "EUR",
      items: items.map(item => ({
        id: item.productId,
        name: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
    });

    try {
      // Prepare cart items for checkout
      const checkoutItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const { data: result, error } = await supabase.functions.invoke("checkout", {
        body: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || undefined,
          shippingMethod: data.shippingMethod,
          shippingAddress: {
            lockerAddress: data.lockerAddress,
            lockerId: data.lockerId,
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
        },
      });

      if (error) throw error;

      if (result?.checkoutUrl) {
        // Clear cart before redirect
        clearCart();
        // Redirect to Stripe
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error("Nepavyko sukurti apmokėjimo sesijos");
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
                    <Input {...register("phone")} id="phone" placeholder="+370..." />
                    {errors.phone && (
                      <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>
                    )}
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
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <Label htmlFor="lockerAddress">Paštomato adresas *</Label>
                      <Input
                        {...register("lockerAddress")}
                        id="lockerAddress"
                        placeholder="Įveskite paštomato adresą"
                        className="mt-2"
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
                  Mokėjimas
                </h2>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Būsite nukreipti į saugų Stripe mokėjimo puslapį.
                  </p>
                  <p className="font-medium">
                    Mokėsite depozitą: {formatCartPrice(depositTotal)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Likusi suma ({formatCartPrice(balanceTotal)}) bus apmokėta vėliau, prieš siunčiant užsakymą.
                </p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Apdorojama...
                </>
              ) : step === 1 ? (
                "Tęsti į mokėjimą"
              ) : (
                `Apmokėti ${formatCartPrice(depositTotal)}`
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
                  <span className="text-muted-foreground">Pilna kaina</span>
                  <span>{formatCartPrice(fullTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pristatymas</span>
                  <span className="text-green-600">Nemokamas</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Nuolaida ({appliedDiscount.code})</span>
                    <span>-{formatCartPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-primary pt-2 border-t border-dashed">
                  <span>Mokėsite dabar (depozitas)</span>
                  <span>{formatCartPrice(depositTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Likusi suma (vėliau)</span>
                  <span>{formatCartPrice(balanceTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
