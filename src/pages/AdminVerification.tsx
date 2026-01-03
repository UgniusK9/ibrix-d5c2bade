import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  User
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
  const [dbStats, setDbStats] = useState<any>(null);

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
          name: 'Admin Authentication',
          status: 'pass',
          message: `Authenticated as admin: ${data.user?.email}`,
          details: data
        });
      } else if (data?.authenticated) {
        newResults.push({
          name: 'Admin Authentication',
          status: 'fail',
          message: `Authenticated but NOT admin. Role: ${data.role}`,
          details: data
        });
      } else {
        newResults.push({
          name: 'Admin Authentication',
          status: 'fail',
          message: 'Not authenticated',
        });
      }
    } catch (e: any) {
      newResults.push({
        name: 'Admin Authentication',
        status: 'fail',
        message: `Whoami error: ${e.message}`,
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
        name: 'Stripe Webhook Config',
        status: allConfigured ? 'pass' : 'fail',
        message: allConfigured 
          ? 'All Stripe secrets configured' 
          : 'Missing Stripe configuration',
        details: healthData.config
      });
    } catch (e: any) {
      newResults.push({
        name: 'Stripe Webhook Config',
        status: 'fail',
        message: `Health check error: ${e.message}`,
      });
    }

    // 3. Check DB tables exist
    try {
      const { data: ordersData, error: ordersError } = await supabase.functions.invoke('admin', {
        body: { action: 'list_orders' }
      });
      
      if (ordersError) throw ordersError;
      
      const orderCount = ordersData?.orders?.length || 0;
      newResults.push({
        name: 'Orders Table',
        status: 'pass',
        message: `Found ${orderCount} orders`,
        details: { count: orderCount }
      });
    } catch (e: any) {
      newResults.push({
        name: 'Orders Table',
        status: 'fail',
        message: `Admin API error: ${e.message}`,
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
        name: 'Products Table',
        status: products && products.length > 0 ? 'pass' : 'warn',
        message: `Found ${products?.length || 0} active products`,
        details: products
      });
    } catch (e: any) {
      newResults.push({
        name: 'Products Table',
        status: 'fail',
        message: `Products query error: ${e.message}`,
      });
    }

    // 5. Check webhook_events table
    try {
      const { count, error } = await supabase
        .from('webhook_events')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      newResults.push({
        name: 'Webhook Events Table',
        status: 'pass',
        message: `Idempotency table exists with ${count || 0} events`,
        details: { count }
      });
    } catch (e: any) {
      newResults.push({
        name: 'Webhook Events Table',
        status: 'fail',
        message: `Webhook events query error: ${e.message}`,
      });
    }

    // 6. Check payments table has stripe_event_id column
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('stripe_event_id')
        .limit(1);
      
      if (error && error.message.includes('column')) {
        throw new Error('stripe_event_id column missing');
      }
      
      newResults.push({
        name: 'Payments Idempotency',
        status: 'pass',
        message: 'stripe_event_id column exists in payments table',
      });
    } catch (e: any) {
      newResults.push({
        name: 'Payments Idempotency',
        status: 'fail',
        message: `Payments idempotency: ${e.message}`,
      });
    }

    // 7. Check email config
    const resendConfigured = webhookHealth?.config?.resend_configured;
    newResults.push({
      name: 'Email (Resend)',
      status: resendConfigured ? 'pass' : 'warn',
      message: resendConfigured 
        ? 'RESEND_API_KEY configured' 
        : 'RESEND_API_KEY not configured - emails will be logged only',
    });

    setResults(newResults);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      runVerification();
    }
  }, [isAdmin]);

  const copyVerificationQueries = () => {
    const queries = `-- VERIFICATION QUERIES - Run in Supabase SQL Editor

-- 1. Check orders count and recent orders
SELECT COUNT(*) as total_orders FROM orders;
SELECT id, order_number, status, deposit_total_eur, balance_total_eur, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check payments count and types
SELECT type, status, COUNT(*) as count, SUM(amount_eur) as total_eur 
FROM payments 
GROUP BY type, status;

-- 3. Check shipments
SELECT id, order_id, status, tracking_token, created_at 
FROM shipments 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check webhook events (idempotency)
SELECT stripe_event_id, event_type, processed_at 
FROM webhook_events 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check analytics events
SELECT name, COUNT(*) as count 
FROM events 
WHERE name IN ('deposit_paid', 'balance_paid', 'balance_requested', 'purchase', 'order_created')
GROUP BY name;

-- 6. Check products
SELECT id, title, price_eur, deposit_eur, stock_status 
FROM products 
WHERE status = 'active';

-- 7. Check users/admins
SELECT id, email, role, created_at 
FROM users 
WHERE role = 'admin';
`;
    navigator.clipboard.writeText(queries);
    toast.success('Verification queries copied!');
  };

  if (!isAdmin && user) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required.</p>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access verification tools.</p>
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
            <h1 className="font-heading text-3xl font-bold">System Verification</h1>
            <p className="text-muted-foreground">Production readiness checks</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={copyVerificationQueries} variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Copy SQL Queries
            </Button>
            <Button onClick={runVerification} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Run Checks
            </Button>
          </div>
        </div>

        {/* Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{passCount}</p>
              <p className="text-sm text-muted-foreground">Passed</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{warnCount}</p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{failCount}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold">Verification Results</h2>
          </div>
          <div className="divide-y divide-border">
            {loading && results.length === 0 ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-2">Running checks...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <Database className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-2">Click "Run Checks" to verify system</p>
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
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Configuration Checklist */}
        <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading text-xl font-semibold mb-4">Production Checklist</h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Server className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">1. Stripe Webhook Setup</p>
                <p className="text-muted-foreground">
                  Endpoint: <code className="bg-muted px-1 rounded">https://huawtqggkzujiptndmns.supabase.co/functions/v1/stripe-webhook</code>
                </p>
                <p className="text-muted-foreground mt-1">
                  Events to enable: <code>checkout.session.completed</code>, <code>payment_intent.payment_failed</code>, <code>charge.refunded</code>
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">2. Stripe Secrets</p>
                <p className="text-muted-foreground">
                  Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Lovable secrets.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">3. Resend Email</p>
                <p className="text-muted-foreground">
                  1. Go to <a href="https://resend.com/domains" className="text-primary underline" target="_blank">resend.com/domains</a>
                </p>
                <p className="text-muted-foreground">
                  2. Add domain: ibrix.lt
                </p>
                <p className="text-muted-foreground">
                  3. Add DNS records: TXT for SPF, CNAME for DKIM
                </p>
                <p className="text-muted-foreground">
                  4. Wait for "Verified" status
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">4. Admin User Setup</p>
                <p className="text-muted-foreground">
                  Run in Supabase SQL Editor:
                </p>
                <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-x-auto">
{`UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div className="mt-8 bg-muted/30 border border-border rounded-xl p-6">
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
