import { useState } from 'react';
import { 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  CreditCard,
  Mail,
  Server,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface AdminSetupProps {
  webhookHealth?: {
    config?: {
      stripe_secret_configured?: boolean;
      webhook_secret_configured?: boolean;
      resend_configured?: boolean;
    };
  } | null;
}

export function AdminSetup({ webhookHealth }: AdminSetupProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState<string | null>('stripe');

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'xutfxycojeydcgrpsrsy';
  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/stripe-webhook`;
  
  const stripeConfigured = webhookHealth?.config?.stripe_secret_configured && 
                           webhookHealth?.config?.webhook_secret_configured;
  const resendConfigured = webhookHealth?.config?.resend_configured;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('admDash.setupCopied', { label }));
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const adminSqlCommand = user?.email 
    ? `UPDATE users SET role = 'admin' WHERE email = '${user.email}';`
    : `UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';`;

  return (
    <div className="space-y-4">
      {/* Section: Stripe Webhook */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('stripe')}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stripeConfigured ? 'bg-green-500/10' : 'bg-yellow-500/10'
            }`}>
              <CreditCard className={`w-5 h-5 ${stripeConfigured ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
            <div className="text-left">
              <p className="font-semibold">Stripe Webhook</p>
              <p className="text-sm text-muted-foreground">{t('admDash.setupStripeDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={stripeConfigured ? 'default' : 'secondary'}>
              {stripeConfigured ? t('admDash.setupConfigured') : t('admDash.setupNeedsSetup')}
            </Badge>
            {expandedSection === 'stripe' ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </button>
        
        {expandedSection === 'stripe' && (
          <div className="p-4 pt-0 border-t border-border space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">{t('admDash.setupStepCopyUrl')}</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-background border border-border rounded px-3 py-2 text-xs font-mono truncate">
                    {webhookUrl}
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">{t('admDash.setupEventsTitle')}</p>
                <div className="flex flex-wrap gap-2">
                  {['checkout.session.completed', 'checkout.session.expired', 'payment_intent.payment_failed', 'charge.refunded'].map((event) => (
                    <code key={event} className="bg-background border border-border rounded px-2 py-1 text-xs font-mono">
                      {event}
                    </code>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">{t('admDash.setupAfterCreate')}</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>{t('admDash.setupCopyStart')} <strong>Signing Secret</strong> ({t('admDash.setupStartsWith')} <code>whsec_</code>)</li>
                  <li>{t('admDash.setupPasteSecret')} <code>STRIPE_WEBHOOK_SECRET</code></li>
                </ul>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('admDash.setupOpenStripe')}
            </Button>
          </div>
        )}
      </div>

      {/* Section: Resend Email */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('resend')}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              resendConfigured ? 'bg-green-500/10' : 'bg-yellow-500/10'
            }`}>
              <Mail className={`w-5 h-5 ${resendConfigured ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
            <div className="text-left">
              <p className="font-semibold">Resend Email</p>
              <p className="text-sm text-muted-foreground">{t('admDash.setupResendDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={resendConfigured ? 'default' : 'secondary'}>
              {resendConfigured ? t('admDash.setupApiKeyPresent') : t('admDash.setupNeedsSetup')}
            </Badge>
            {expandedSection === 'resend' ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </button>
        
        {expandedSection === 'resend' && (
          <div className="p-4 pt-0 border-t border-border space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Domain: ibrix.lt</p>
                <p className="text-sm text-muted-foreground">
                  {t('admDash.setupAddDns')}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium">{t('admCommon.type')}</th>
                      <th className="text-left py-2 pr-4 font-medium">{t('admDash.setupDnsName')}</th>
                      <th className="text-left py-2 font-medium">{t('admProducts.offerValue')}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="border-b border-border">
                      <td className="py-2 pr-4">TXT</td>
                      <td className="py-2 pr-4">@ arba ibrix.lt</td>
                      <td className="py-2">v=spf1 include:amazonses.com ~all</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-2 pr-4">CNAME</td>
                      <td className="py-2 pr-4">resend._domainkey</td>
                      <td className="py-2">{t('admDash.setupFromResend')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">CNAME</td>
                      <td className="py-2 pr-4">bounce</td>
                      <td className="py-2">{t('admDash.setupFromResend')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-muted-foreground">
                  {t('admDash.setupUnverifiedStart')} <code>onboarding@resend.dev</code> {t('admDash.setupFallbackMode')}
                </p>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open('https://resend.com/domains', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('admDash.setupOpenResend')}
            </Button>
          </div>
        )}
      </div>

      {/* Section: Admin Role */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('admin')}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">{t('admDash.setupAdminRights')}</p>
              <p className="text-sm text-muted-foreground">{t('admDash.setupGrantRole')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{t('admDash.setupManualAction')}</Badge>
            {expandedSection === 'admin' ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </button>
        
        {expandedSection === 'admin' && (
          <div className="p-4 pt-0 border-t border-border space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong>{t('admDash.setupSecurityReasons')}</strong> {t('admDash.setupSqlOnly')}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">{t('admDash.setupSqlTitle')}</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-background border border-border rounded px-3 py-2 text-xs font-mono overflow-x-auto">
                    {adminSqlCommand}
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(adminSqlCommand, t('admDash.setupSqlLabel'))}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">{t('admDash.setupHowTo')}</p>
                <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                  <li>{t('admDash.setupStepOpenEditor')}</li>
                  <li>{t('admDash.setupStepPaste')}</li>
                  <li>{t('admDash.setupStepChangeEmail')}</li>
                  <li>{t('admDash.setupStepRun')}</li>
                  <li>{t('admDash.setupStepRefresh')}</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Status */}
      <div className="bg-muted/30 border border-border rounded-xl p-4">
        <p className="text-sm font-medium mb-3">{t('admDash.setupQuickStatus')}</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            {stripeConfigured ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            )}
            <p className="text-xs text-muted-foreground">Stripe</p>
          </div>
          <div className="text-center">
            {resendConfigured ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            )}
            <p className="text-xs text-muted-foreground">Email</p>
          </div>
          <div className="text-center">
            <Server className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Edge Fn</p>
          </div>
        </div>
      </div>
    </div>
  );
}
