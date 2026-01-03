import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Copy,
  Database,
  Shield,
  CreditCard,
  Mail,
  Server,
  User,
  ArrowLeft,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail' | 'warn' | 'pending';
  message: string;
  details?: any;
}

interface WhoamiResponse {
  authenticated: boolean;
  user?: { id: string; email: string };
  role?: string;
  isAdmin?: boolean;
}

interface WebhookHealthResponse {
  status: string;
  config: {
    stripe_secret_configured: boolean;
    webhook_secret_configured: boolean;
    supabase_url_configured: boolean;
    service_role_configured: boolean;
    resend_configured: boolean;
  };
}

export default function AdminVerification() {
  const { isAdmin, user } = useAuth();
  const [searchParams] = useSearchParams();
  const showDebug = searchParams.get('debug') === 'true';
  
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [whoami, setWhoami] = useState<WhoamiResponse | null>(null);
  const [webhookHealth, setWebhookHealth] = useState<WebhookHealthResponse | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'huawtqggkzujiptndmns';
  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/stripe-webhook`;

  const runVerification = async () => {
    setLoading(true);
    setResults([]);
    const newResults: VerificationResult[] = [];

    // 1. Check whoami
    try {
      const { data, error } = await supabase.functions.invoke<WhoamiResponse>('whoami');
      setWhoami(data);
      if (data?.isAdmin) {
        newResults.push({
          name: 'Admin Autentifikacija',
          status: 'pass',
          message: `Prisijungta kaip admin: ${data.user?.email}`,
          details: data
        });
      } else if (data?.authenticated) {
        newResults.push({
          name: 'Admin Autentifikacija',
          status: 'fail',
          message: `Prisijungta, bet NE admin. Rolė: ${data.role}`,
          details: data
        });
      } else {
        newResults.push({
          name: 'Admin Autentifikacija',
          status: 'fail',
          message: 'Neprisijungta',
        });
      }
    } catch (e: any) {
      newResults.push({
        name: 'Admin Autentifikacija',
        status: 'fail',
        message: `Whoami klaida: ${e.message}`,
      });
    }

    // 2. Check webhook health
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook?health=true`,
        { method: 'GET' }
      );
      const healthData = await response.json();
      setWebhookHealth(healthData);
      
      const allConfigured = healthData.config && 
        healthData.config.stripe_secret_configured && 
        healthData.config.webhook_secret_configured;
      
      newResults.push({
        name: 'Stripe Webhook Konfigūracija',
        status: allConfigured ? 'pass' : 'warn',
        message: allConfigured 
          ? 'Visi Stripe raktai sukonfigūruoti' 
          : 'Trūksta Stripe konfigūracijos',
        details: healthData.config
      });
    } catch (e: any) {
      newResults.push({
        name: 'Stripe Webhook Konfigūracija',
        status: 'fail',
        message: `Health check klaida: ${e.message}`,
      });
    }

    // 3. Check Orders via Admin API
    try {
      const { data: ordersData, error: ordersError } = await supabase.functions.invoke('admin', {
        body: { action: 'list_orders' }
      });
      
      if (ordersError) throw ordersError;
      
      const orderCount = ordersData?.orders?.length || 0;
      newResults.push({
        name: 'Užsakymų lentelė',
        status: 'pass',
        message: `Rasta ${orderCount} užsakymų`,
        details: { count: orderCount }
      });
    } catch (e: any) {
      newResults.push({
        name: 'Užsakymų lentelė',
        status: 'fail',
        message: `Admin API klaida: ${e.message}`,
      });
    }

    // 4. Check products
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, title, price_eur, deposit_eur, stock_status')
        .eq('status', 'active')
        .limit(10);
      
      if (error) throw error;
      
      newResults.push({
        name: 'Produktų lentelė',
        status: products && products.length > 0 ? 'pass' : 'warn',
        message: `Rasta ${products?.length || 0} aktyvių produktų`,
        details: products
      });
    } catch (e: any) {
      newResults.push({
        name: 'Produktų lentelė',
        status: 'fail',
        message: `Produktų užklausa nepavyko: ${e.message}`,
      });
    }

    // 5. Check users table
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      newResults.push({
        name: 'Vartotojų lentelė',
        status: 'pass',
        message: `Rasta ${count || 0} vartotojų`,
        details: { count }
      });
    } catch (e: any) {
      newResults.push({
        name: 'Vartotojų lentelė',
        status: 'fail',
        message: `Vartotojų užklausa nepavyko: ${e.message}`,
      });
    }

    // 6. Check webhook_events table
    try {
      const { count, error } = await supabase
        .from('webhook_events')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      newResults.push({
        name: 'Webhook Events (Idempotencija)',
        status: 'pass',
        message: `Idempotencijos lentelė egzistuoja su ${count || 0} įvykių`,
        details: { count }
      });
    } catch (e: any) {
      newResults.push({
        name: 'Webhook Events (Idempotencija)',
        status: 'fail',
        message: `Webhook events užklausa nepavyko: ${e.message}`,
      });
    }

    // 7. Check payments table has stripe_event_id column
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('stripe_event_id')
        .limit(1);
      
      if (error && error.message.includes('column')) {
        throw new Error('stripe_event_id stulpelio nėra');
      }
      
      newResults.push({
        name: 'Mokėjimų Idempotencija',
        status: 'pass',
        message: 'stripe_event_id stulpelis egzistuoja payments lentelėje',
      });
    } catch (e: any) {
      newResults.push({
        name: 'Mokėjimų Idempotencija',
        status: 'fail',
        message: `Mokėjimų idempotencija: ${e.message}`,
      });
    }

    // 8. Check email config
    const resendConfigured = webhookHealth?.config?.resend_configured;
    newResults.push({
      name: 'El. paštas (Resend)',
      status: resendConfigured ? 'pass' : 'warn',
      message: resendConfigured 
        ? 'RESEND_API_KEY sukonfigūruotas' 
        : 'RESEND_API_KEY nesukonfigūruotas - laiškai bus tik loginami',
    });

    setResults(newResults);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      runVerification();
    }
  }, [isAdmin]);

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL nukopijuotas!');
  };

  const copyVerificationQueries = () => {
    const queries = `-- VERIFICATION QUERIES - Paleiskite Supabase SQL Editor

-- 1. Užsakymų skaičius ir naujausi užsakymai
SELECT COUNT(*) as total_orders FROM orders;
SELECT id, order_number, status, deposit_total_eur, balance_total_eur, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Mokėjimų skaičius pagal tipą
SELECT type, status, COUNT(*) as count, SUM(amount_eur) as total_eur 
FROM payments 
GROUP BY type, status;

-- 3. Shipments
SELECT id, order_id, status, tracking_token, created_at 
FROM shipments 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Webhook events (idempotencija)
SELECT stripe_event_id, event_type, processed_at 
FROM webhook_events 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Analytics events
SELECT name, COUNT(*) as count 
FROM events 
WHERE name IN ('deposit_paid', 'balance_paid', 'balance_requested', 'purchase', 'order_created')
GROUP BY name;

-- 6. Vartotojai ir admin
SELECT id, email, role, created_at 
FROM users 
ORDER BY created_at DESC
LIMIT 10;
`;
    navigator.clipboard.writeText(queries);
    toast.success('SQL užklausos nukopijuotos!');
  };

  if (!isAdmin && user) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Prieiga uždrausta</h1>
          <p className="text-muted-foreground">Reikalinga administratoriaus prieiga.</p>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Reikalinga autentifikacija</h1>
          <p className="text-muted-foreground">Prisijunkite, kad pasiektumėte patikros įrankius.</p>
        </div>
      </PageLayout>
    );
  }

  const getStatusIcon = (status: VerificationResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'fail': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warn': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />;
    }
  };

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warnCount = results.filter(r => r.status === 'warn').length;

  return (
    <PageLayout>
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atgal
                </Link>
              </Button>
            </div>
            <h1 className="font-heading text-3xl font-bold">Sistemos Patikra</h1>
            <p className="text-muted-foreground">Production readiness tikrinimas</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={copyVerificationQueries} variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              SQL Užklausos
            </Button>
            <Button onClick={runVerification} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Tikrinti
            </Button>
          </div>
        </div>

        {/* Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{passCount}</p>
              <p className="text-sm text-muted-foreground">Praėjo</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{warnCount}</p>
              <p className="text-sm text-muted-foreground">Įspėjimai</p>
            </div>
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{failCount}</p>
              <p className="text-sm text-muted-foreground">Nepavyko</p>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-8">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold">Patikros Rezultatai</h2>
          </div>
          <div className="divide-y divide-border">
            {loading && results.length === 0 ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-2">Vykdoma patikra...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <Database className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-2">Spauskite "Tikrinti" sistemai patikrinti</p>
              </div>
            ) : (
              results.map((result, index) => (
                <div key={index} className="p-4 flex items-start gap-4">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <p className="font-medium">{result.name}</p>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {showDebug && result.details && (
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                  <Badge variant={result.status === 'pass' ? 'default' : result.status === 'warn' ? 'secondary' : 'destructive'}>
                    {result.status === 'pass' ? 'PRAĖJO' : result.status === 'warn' ? 'ĮSPĖJIMAS' : 'NEPAVYKO'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4">Greiti Veiksmai</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">Stripe Webhook URL</p>
                <code className="text-xs text-muted-foreground font-mono">{webhookUrl}</code>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyWebhookUrl}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start" onClick={() => window.open('https://dashboard.stripe.com/test/webhooks', '_blank')}>
                <CreditCard className="w-4 h-4 mr-2" />
                Stripe Webhooks
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => window.open('https://resend.com/domains', '_blank')}>
                <Mail className="w-4 h-4 mr-2" />
                Resend Domains
              </Button>
            </div>
          </div>
        </div>

        {/* Required Stripe Events */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4">Reikalingi Stripe Įvykiai</h2>
          <div className="flex flex-wrap gap-2">
            {['checkout.session.completed', 'checkout.session.expired', 'payment_intent.payment_failed', 'charge.refunded'].map((event) => (
              <code key={event} className="bg-muted border border-border rounded px-3 py-1.5 text-sm font-mono">
                {event}
              </code>
            ))}
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div className="bg-muted/30 border border-border rounded-xl p-6">
            <h2 className="font-heading text-xl font-semibold mb-4">Debug Data</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">Whoami Response:</p>
                <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
                  {JSON.stringify(whoami, null, 2)}
                </pre>
              </div>
              <div>
                <p className="font-medium mb-2">Webhook Health:</p>
                <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
                  {JSON.stringify(webhookHealth, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
