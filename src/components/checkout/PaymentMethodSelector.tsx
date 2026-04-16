import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";

export type PaymentMethod = {
  id: string;
  code: string;
  provider: 'stripe' | 'paypal' | 'paysera' | 'opay' | 'inbank';
  title: string;
  subtitle: string;
  logo: string;
  enabled: boolean;
  bankCode?: string; // For Paysera/OPAY banklink
  periodMonths?: number; // For Inbank installments
};

const PAYMENT_METHODS: PaymentMethod[] = [
  // ─── OPAY (primary — Lithuanian payment gateway) ──────────────────
  {
    id: 'opay-card',
    code: 'opay_card',
    provider: 'opay',
    title: 'Banko kortelė',
    subtitle: 'Visa, Mastercard per OPAY',
    logo: '/payment-logos/card.svg',
    enabled: true,
  },
  {
    id: 'opay-banklink',
    code: 'opay_banklink',
    provider: 'opay',
    title: 'Banko pavedimas',
    subtitle: 'Swedbank, SEB, Luminor, Revolut ir kt. per OPAY',
    logo: '/payment-logos/swedbank.svg',
    enabled: true,
  },

  // ─── Inbank (BNPL — installment financing) ────────────────────────
  {
    id: 'inbank-12',
    code: 'inbank_12m',
    provider: 'inbank',
    title: 'Inbank išsimokėjimas (12 mėn.)',
    subtitle: 'Mokėk dalimis per 12 mėnesių',
    logo: '/payment-logos/card.svg',
    enabled: true,
    periodMonths: 12,
  },
  {
    id: 'inbank-24',
    code: 'inbank_24m',
    provider: 'inbank',
    title: 'Inbank išsimokėjimas (24 mėn.)',
    subtitle: 'Mokėk dalimis per 24 mėnesius',
    logo: '/payment-logos/card.svg',
    enabled: true,
    periodMonths: 24,
  },
  {
    id: 'inbank-36',
    code: 'inbank_36m',
    provider: 'inbank',
    title: 'Inbank išsimokėjimas (36 mėn.)',
    subtitle: 'Mokėk dalimis per 36 mėnesius',
    logo: '/payment-logos/card.svg',
    enabled: true,
    periodMonths: 36,
  },

  // ─── Legacy (palikti atjungti – galima vėl įjungti vėliau) ─────────
  {
    id: 'stripe-card',
    code: 'card',
    provider: 'stripe',
    title: 'Kortelė (Stripe)',
    subtitle: 'Senas mokėjimo būdas — neaktyvus',
    logo: '/payment-logos/card.svg',
    enabled: false,
  },
  {
    id: 'paypal',
    code: 'paypal',
    provider: 'paypal',
    title: 'PayPal',
    subtitle: 'Atsiskaityk per PayPal paskyrą',
    logo: '/payment-logos/paypal.svg',
    enabled: false,
  },
  {
    id: 'paysera-swedbank',
    code: 'swedbank',
    provider: 'paysera',
    title: 'Swedbank',
    subtitle: 'Tiesioginis mokėjimas per Swedbank',
    logo: '/payment-logos/swedbank.svg',
    enabled: false, // Will be enabled when Paysera is configured
    bankCode: 'hanzalt',
  },
  {
    id: 'paysera-seb',
    code: 'seb',
    provider: 'paysera',
    title: 'SEB',
    subtitle: 'Tiesioginis mokėjimas per SEB',
    logo: '/payment-logos/seb.svg',
    enabled: false,
    bankCode: 'seblt',
  },
  {
    id: 'paysera-luminor',
    code: 'luminor',
    provider: 'paysera',
    title: 'Luminor',
    subtitle: 'Tiesioginis mokėjimas per Luminor',
    logo: '/payment-logos/luminor.svg',
    enabled: false,
    bankCode: 'lku',
  },
  {
    id: 'paysera-revolut',
    code: 'revolut',
    provider: 'paysera',
    title: 'Revolut',
    subtitle: 'Atsiskaityk per Revolut',
    logo: '/payment-logos/revolut.svg',
    enabled: false,
    bankCode: 'revolut',
  },
  {
    id: 'paysera-artea',
    code: 'artea',
    provider: 'paysera',
    title: 'Artea',
    subtitle: 'Tiesioginis mokėjimas per Artea',
    logo: '/payment-logos/artea.svg',
    enabled: false,
    bankCode: 'artea',
  },
  {
    id: 'paysera-siauliu',
    code: 'siauliu',
    provider: 'paysera',
    title: 'Šiaulių bankas',
    subtitle: 'Tiesioginis mokėjimas per Šiaulių banką',
    logo: '/payment-logos/siauliu.svg',
    enabled: false,
    bankCode: 'sb',
  },
  {
    id: 'paysera-lku',
    code: 'lku',
    provider: 'paysera',
    title: 'LKU',
    subtitle: 'Tiesioginis mokėjimas per LKU',
    logo: '/payment-logos/lku.svg',
    enabled: false,
    bankCode: 'lku',
  },
  {
    id: 'paysera-citadele',
    code: 'citadele',
    provider: 'paysera',
    title: 'Citadele',
    subtitle: 'Tiesioginis mokėjimas per Citadele',
    logo: '/payment-logos/citadele.svg',
    enabled: false,
    bankCode: 'citadele',
  },
  {
    id: 'paysera-generic',
    code: 'paysera',
    provider: 'paysera',
    title: 'Paysera',
    subtitle: 'Kiti Paysera mokėjimo būdai',
    logo: '/payment-logos/paysera.svg',
    enabled: false,
    bankCode: 'paysera',
  },
];

interface PaymentMethodSelectorProps {
  selectedMethod: string | null;
  onSelect: (method: PaymentMethod) => void;
}

// Fallback inline SVGs for payment logos
const LogoFallback: React.FC<{ code: string }> = ({ code }) => {
  const icons: Record<string, JSX.Element> = {
    card: (
      <svg className="w-8 h-6" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="24" rx="4" fill="#1a1f36"/>
        <rect x="2" y="6" width="28" height="4" fill="#6772e5"/>
        <rect x="4" y="14" width="8" height="3" rx="1" fill="#aab4c5"/>
        <rect x="14" y="14" width="4" height="3" rx="1" fill="#aab4c5"/>
      </svg>
    ),
    googlepay: (
      <svg className="w-10 h-6" viewBox="0 0 41 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.526 2.635v4.083h2.518c.6 0 1.096-.202 1.488-.605.403-.402.605-.912.605-1.528 0-.605-.202-1.115-.605-1.528-.392-.403-.888-.604-1.488-.604h-2.518v.182zm0 5.52v4.736h-1.504V1.198h3.99c1.013 0 1.873.337 2.582 1.012.72.675 1.08 1.497 1.08 2.466 0 .991-.36 1.819-1.08 2.482-.697.675-1.559 1.012-2.582 1.012l-2.486-.015z" fill="#5F6368"/>
        <path d="M27.194 10.442c0 .627-.218 1.126-.654 1.5-.458.395-1.075.593-1.849.593-.72 0-1.298-.168-1.733-.504a1.632 1.632 0 01-.654-1.38c0-.627.247-1.121.742-1.484.494-.362 1.13-.544 1.907-.544.578 0 1.078.121 1.5.363.436.242.655.592.741.456h-.001z" fill="#4285F4"/>
        <path d="M32.69 1.198v11.694h-1.471V11.61c-.48.714-1.199 1.07-2.155 1.07-.893 0-1.65-.338-2.27-1.012-.608-.675-.912-1.518-.912-2.529 0-1.01.304-1.854.913-2.529.619-.675 1.376-1.012 2.269-1.012.956 0 1.675.356 2.155 1.07V1.198h1.471z" fill="#4285F4"/>
        <path d="M34.16 12.892V5.813h1.471v7.08H34.16zm.741-8.05a.921.921 0 01-.678-.282.922.922 0 01-.282-.677c0-.272.094-.5.282-.688a.921.921 0 01.678-.282c.272 0 .5.094.688.282.188.188.282.416.282.688a.937.937 0 01-.282.677.937.937 0 01-.688.282z" fill="#4285F4"/>
      </svg>
    ),
    applepay: (
      <svg className="w-10 h-6" viewBox="0 0 43 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.996 2.313c.52-.66.872-1.574.775-2.489-.75.031-1.657.503-2.195 1.133-.48.553-.902 1.447-.789 2.3.838.064 1.693-.423 2.21-1.944z" fill="#000"/>
        <path d="M8.756 3.199c-1.221-.072-2.262.693-2.843.693-.595 0-1.506-.657-2.486-.64-1.28.019-2.462.745-3.12 1.892-1.334 2.304-.343 5.717.947 7.589.636.921 1.393 1.951 2.39 1.914.953-.037 1.316-.617 2.468-.617 1.152 0 1.478.617 2.486.598 1.027-.019 1.678-.939 2.314-1.86.723-1.053 1.018-2.074 1.036-2.129-.019-.019-1.985-.766-2.003-3.033-.019-1.897 1.548-2.806 1.62-2.862-.889-1.3-2.264-1.447-2.754-1.482l-.055-.063z" fill="#000"/>
      </svg>
    ),
    paypal: (
      <svg className="w-10 h-6" viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.462 5.33h8.584c4.74 0 6.766 2.4 6.355 5.896-.565 4.812-3.91 7.48-8.517 7.48h-2.235c-.647 0-1.127.484-1.258 1.292L14.33 26.67c-.066.406-.297.648-.613.648H10c-.448 0-.713-.388-.614-.94L12.462 5.33z" fill="#003087"/>
        <path d="M47.588 5.01h-5.304c-.365 0-.678.27-.736.634l-2.143 13.58a.446.446 0 00.44.516h2.533c.365 0 .677-.27.736-.634l.578-3.663c.059-.364.372-.634.736-.634h1.697c3.536 0 5.577-1.71 6.11-5.1.24-1.484.01-2.65-.683-3.47-.762-.902-2.114-1.23-3.964-1.23z" fill="#003087"/>
        <path d="M67.11 10.576h-2.545c-.213 0-.417.1-.545.27l-3.138 4.62-1.33-4.44a.673.673 0 00-.645-.45h-2.502c-.297 0-.505.289-.414.57l2.505 7.357-2.358 3.328c-.204.288.006.692.352.692h2.541c.21 0 .412-.097.542-.265l7.57-10.937c.2-.29-.012-.745-.433-.745z" fill="#009cde"/>
        <path d="M81.852 5.01h-5.303c-.366 0-.678.27-.737.634l-2.143 13.58a.446.446 0 00.44.516h2.72c.256 0 .474-.188.516-.444l.608-3.853c.059-.364.372-.634.736-.634h1.698c3.535 0 5.576-1.71 6.11-5.1.24-1.484.01-2.65-.684-3.47-.762-.902-2.113-1.23-3.961-1.23z" fill="#009cde"/>
      </svg>
    ),
  };
  
  return icons[code] || (
    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs font-medium text-muted-foreground">
      {code.slice(0, 2).toUpperCase()}
    </div>
  );
};

export function PaymentMethodSelector({ selectedMethod, onSelect }: PaymentMethodSelectorProps) {
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const handleImgError = (methodId: string) => {
    setImgErrors(prev => new Set(prev).add(methodId));
  };

  return (
    <div className="space-y-2">
      {PAYMENT_METHODS.map((method) => {
        const isSelected = selectedMethod === method.id;
        const showFallback = imgErrors.has(method.id);
        
        return (
          <button
            key={method.id}
            type="button"
            disabled={!method.enabled}
            onClick={() => method.enabled && onSelect(method)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : method.enabled
                ? "border-border hover:border-primary/50 hover:bg-muted/30"
                : "border-border/50 bg-muted/20 opacity-60 cursor-not-allowed"
            )}
          >
            {/* Logo */}
            <div className="w-12 h-8 flex items-center justify-center flex-shrink-0">
              {showFallback ? (
                <LogoFallback code={method.code} />
              ) : (
                <img
                  src={method.logo}
                  alt={method.title}
                  className="max-w-full max-h-full object-contain"
                  onError={() => handleImgError(method.id)}
                />
              )}
            </div>
            
            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{method.title}</span>
                {!method.enabled && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    Greitai
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{method.subtitle}</p>
            </div>
            
            {/* Radio indicator */}
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
              isSelected 
                ? "border-primary bg-primary" 
                : "border-muted-foreground/30"
            )}>
              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
          </button>
        );
      })}
      
      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
        <Lock className="w-3 h-3" />
        <span>Visi mokėjimai yra saugūs ir šifruoti</span>
      </div>
    </div>
  );
}

export { PAYMENT_METHODS };
