import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EMAIL_TYPES = [
  { value: "deposit_confirmed", label: "Užsakymo patvirtinimas (depozitas)" },
  { value: "balance_request", label: "Likučio apmokėjimo prašymas" },
  { value: "balance_paid", label: "Likutis apmokėtas" },
  { value: "shipped", label: "Siunta išsiųsta" },
  { value: "gift_card", label: "Dovanų kuponas" },
  { value: "verification_code", label: "El. pašto patvirtinimas" },
  { value: "welcome", label: "Sveikinimo laiškas" },
  { value: "password_reset", label: "Slaptažodžio atkūrimas" },
];

const MOCK_DATA: Record<string, any> = {
  deposit_confirmed: {
    firstName: "Jonas",
    orderNumber: "IBX-000123",
    depositEur: "49.99",
    balanceEur: "49.99",
    totalEur: "99.98",
    hasPreorder: true,
    etaWeeksMin: 4,
    etaWeeksMax: 6,
    trackingToken: "demo-token",
    shippingMethod: "omniva_locker",
    shippingAddress: { lockerName: "Vilnius Akropolis", lockerAddress: "Ozo g. 25, Vilnius" },
    paymentMethod: "Swedbank",
    invoiceNumber: "INV-2025-0042",
    wantsInvoice: true,
    invoiceCompanyName: "UAB Pavyzdys",
    invoiceVatCode: "LT123456789",
    invoiceAddress: "Gedimino pr. 1, Vilnius",
    items: [
      { title_snapshot: "V8 Variklio Konstruktorius", sku_snapshot: "IBX-V8-001", quantity: 1, unit_price_eur: 79.99, unit_deposit_eur: 39.99 },
      { title_snapshot: "Inline-4 Variklis", sku_snapshot: "IBX-I4-002", quantity: 1, unit_price_eur: 19.99, unit_deposit_eur: 9.99 },
    ],
  },
  balance_request: {
    firstName: "Petras",
    orderNumber: "IBX-000456",
    balanceEur: "75.00",
    paymentUrl: "https://ibrix.lt/checkout/balance/demo",
    customMessage: "Jūsų V8 konstruktorius jau paruoštas siuntimui!",
  },
  balance_paid: {
    firstName: "Ona",
    orderNumber: "IBX-000789",
    amountEur: "50.00",
  },
  shipped: {
    firstName: "Marius",
    orderNumber: "IBX-001000",
    trackingNumber: "LT123456789",
    carrierName: "Omniva",
    trackingUrl: "https://ibrix.lt/siuntos-sekimas/IBX-001000?token=demo",
  },
  gift_card: {
    data: {
      recipientName: "Lukas",
      senderName: "Mama",
      code: "IBGC-AB12-CD34",
      amount: 50,
      personalMessage: "Su gimtadieniu! 🎉",
    },
  },
  verification_code: {
    data: { email: "jonas@example.com", code: "482913", firstName: "Jonas" },
  },
  welcome: {
    data: { email: "jonas@example.com", firstName: "Jonas", username: "jonas_builder" },
  },
  password_reset: {
    email: "jonas@example.com",
    firstName: "Jonas",
    resetUrl: "https://ibrix.lt/reset-password?token=demo",
  },
};

export function EmailPreviewManager() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const loadPreview = async () => {
    if (!selectedType) return;
    setLoading(true);
    try {
      const mockData = MOCK_DATA[selectedType] || {};
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { type: selectedType, email: "preview@example.com", dryRun: true, ...mockData },
      });

      if (error) throw error;
      if (data?.html) {
        setHtmlContent(data.html);
      } else if (data?.fallback) {
        setHtmlContent(data.html || "<p>Šablonas sugeneruotas, bet Resend nėra sukonfigūruotas.</p>");
      } else {
        toast.error("Nepavyko gauti HTML");
      }
    } catch (e: any) {
      toast.error("Klaida: " + (e.message || "Nepavyko užkrauti"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          El. pašto šablonų peržiūra
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1.5 block">Šablono tipas</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Pasirinkite šabloną..." />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={loadPreview} disabled={!selectedType || loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Peržiūrėti
          </Button>
        </div>

        {htmlContent && (
          <div className="border rounded-lg overflow-hidden bg-white">
            <iframe
              srcDoc={htmlContent}
              className="w-full border-0"
              style={{ minHeight: 700 }}
              title="Email preview"
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
