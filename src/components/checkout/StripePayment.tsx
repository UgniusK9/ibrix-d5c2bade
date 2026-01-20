import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Load Stripe publishable key from environment variable
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe only if key is available
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface PaymentFormProps {
  orderId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({ orderId, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/uzsakymas?payment=success`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Mokėjimo klaida");
      } else {
        setMessage("Netikėta klaida. Bandykite dar kartą.");
      }
      onError(error.message || "Mokėjimo klaida");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      
      {message && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {message}
        </div>
      )}
      
      <Button
        type="submit"
        size="lg"
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Apdorojama...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Apmokėti
          </>
        )}
      </Button>
    </form>
  );
}

interface StripePaymentProps {
  orderId: string;
  amount: number;
  trackingToken?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function StripePayment({ orderId, amount, trackingToken, onSuccess, onError }: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Stripe is configured - must be before useEffect
  const isConfigured = !!(stripePublishableKey && stripePromise);

  useEffect(() => {
    // Skip if not configured
    if (!isConfigured) {
      setIsLoading(false);
      setError('Mokėjimų sistema nekonfigūruota');
      return;
    }

    const createPaymentIntent = async () => {
      try {
        // Build headers with tracking token for guest orders
        const headers: Record<string, string> = {};
        if (trackingToken) {
          headers['x-tracking-token'] = trackingToken;
        }

        const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
          body: { orderId },
          headers,
        });

        if (fnError) {
          throw new Error(fnError.message || 'Nepavyko sukurti mokėjimo');
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('Negauta mokėjimo informacija');
        }
      } catch (err) {
        console.error('Payment intent error:', err);
        setError(err instanceof Error ? err.message : 'Mokėjimo klaida');
        onError(err instanceof Error ? err.message : 'Mokėjimo klaida');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [orderId, trackingToken, onError, isConfigured]);

  // Error states after hooks
  if (!isConfigured) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-destructive font-medium">Mokėjimų sistema nekonfigūruota</p>
        <p className="text-xs text-muted-foreground mt-1">
          Susisiekite su administratoriumi
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Ruošiamas mokėjimas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="bg-muted rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">Mokėjimo forma nepasiekiama</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: 'hsl(224, 77%, 48%)',
            colorBackground: 'hsl(0, 0%, 100%)',
            colorText: 'hsl(220, 40%, 9%)',
            colorDanger: 'hsl(0, 84%, 60%)',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
        locale: 'lt',
      }}
    >
      <PaymentForm orderId={orderId} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
