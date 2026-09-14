import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface IntegrationStatus {
  name: string;
  configured: boolean;
  lastEvent?: string;
  eventCount?: number;
  status: 'active' | 'inactive' | 'warning';
}

export function AnalyticsIntegrationStatus() {
  const { t } = useTranslation();
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const checkIntegrations = async () => {
    setLoading(true);
    
    try {
      // Check for recent analytics events
      const { data: events, error } = await supabase
        .from('events')
        .select('name, source, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Count events by type
      const gaEvents = events?.filter(e => 
        e.name.includes('view_item') || 
        e.name.includes('add_to_cart') || 
        e.name.includes('purchase')
      ) || [];

      const metaEvents = events?.filter(e => 
        e.source === 'server' || 
        e.name.includes('ViewContent') || 
        e.name.includes('Purchase')
      ) || [];

      const recentGaEvents = gaEvents.filter(e => new Date(e.created_at) > oneDayAgo);
      const recentMetaEvents = metaEvents.filter(e => new Date(e.created_at) > oneDayAgo);

      // Determine status
      const gaStatus: IntegrationStatus = {
        name: 'Google Analytics 4',
        configured: recentGaEvents.length > 0 || gaEvents.length > 0,
        lastEvent: gaEvents[0]?.created_at,
        eventCount: recentGaEvents.length,
        status: recentGaEvents.length > 0 ? 'active' : gaEvents.length > 0 ? 'warning' : 'inactive',
      };

      const metaStatus: IntegrationStatus = {
        name: 'Meta Pixel + CAPI',
        configured: recentMetaEvents.length > 0 || metaEvents.length > 0,
        lastEvent: metaEvents.find(e => e.source === 'server')?.created_at || metaEvents[0]?.created_at,
        eventCount: recentMetaEvents.length,
        status: recentMetaEvents.some(e => e.source === 'server') ? 'active' : recentMetaEvents.length > 0 ? 'warning' : 'inactive',
      };

      setIntegrations([gaStatus, metaStatus]);
    } catch (error) {
      console.error('Failed to check integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkIntegrations();
  }, []);

  const getStatusIcon = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'inactive':
        return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getStatusBadge = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">{t("admCommon.active")}</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">{t("admAnalytics.intLimited")}</Badge>;
      case 'inactive':
        return <Badge variant="destructive">{t("admAnalytics.intNotConfigured")}</Badge>;
    }
  };

  const formatLastEvent = (dateString?: string) => {
    if (!dateString) return t('admCommon.noData');
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return t('admAnalytics.intMinsAgo', { num: diffMins });
    if (diffHours < 24) return t('admAnalytics.intHoursAgo', { num: diffHours });
    return t('admAnalytics.intDaysAgo', { num: diffDays });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">{t("admAnalytics.dashIntegrations")}</CardTitle>
          <CardDescription>{t("admAnalytics.intSubtitle")}</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkIntegrations}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t("admCommon.refresh")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div 
              key={integration.name}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(integration.status)}
                <div>
                  <p className="font-medium">{integration.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("admAnalytics.intLastEvent", { val: formatLastEvent(integration.lastEvent) })}
                    {integration.eventCount !== undefined && integration.eventCount > 0 && (
                      <span className="ml-2">{t("admAnalytics.intEvents24h", { num: integration.eventCount })}</span>
                    )}
                  </p>
                </div>
              </div>
              {getStatusBadge(integration.status)}
            </div>
          ))}

          {/* Setup hints */}
          <div className="mt-4 p-4 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium mb-2">{t("admAnalytics.intSetupHints")}</p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {t("admAnalytics.intGaSet")} <code className="px-1 bg-muted rounded">GA_MEASUREMENT_ID</code> {t("admAnalytics.intSecretWord")}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {t("admAnalytics.intMetaSet")} <code className="px-1 bg-muted rounded">META_PIXEL_ID</code> {t("common.and")} <code className="px-1 bg-muted rounded">META_CAPI_TOKEN</code>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <span>
                  CAPI Token: 
                  <a 
                    href="https://business.facebook.com/events_manager" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1 inline-flex items-center gap-1"
                  >
                    Events Manager <ExternalLink className="w-3 h-3" />
                  </a>
                  → Settings → Generate access token
                </span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
