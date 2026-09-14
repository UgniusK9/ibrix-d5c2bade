import { useState, useEffect, useMemo } from 'react';
import { Mail, Send, Users, RefreshCw, Plus, Eye, Trash2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  status: string;
  subscribed_at: string;
}

interface Campaign {
  id: string;
  subject: string;
  content: string;
  status: string;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_at: string;
}

// Subscriber Growth Chart Component
function SubscriberGrowthChart({ subscribers }: { subscribers: Subscriber[] }) {
  const { t } = useTranslation();
  const chartData = useMemo(() => {
    // Group subscribers by date
    const dateMap: Record<string, number> = {};
    
    subscribers.forEach(sub => {
      const date = new Date(sub.subscribed_at).toISOString().split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + 1;
    });

    // Sort dates and create cumulative data
    const sortedDates = Object.keys(dateMap).sort();
    let cumulative = 0;
    
    return sortedDates.map(date => {
      cumulative += dateMap[date];
      return {
        date: new Date(date).toLocaleDateString('lt-LT', { month: 'short', day: 'numeric' }),
        fullDate: date,
        newSubscribers: dateMap[date],
        total: cumulative,
      };
    });
  }, [subscribers]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>{t('admContent.nlNoStats')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">{t('admContent.nlTotalSubs')}</p>
          <p className="text-2xl font-bold">{subscribers.filter(s => s.status === 'active').length}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">{t('admContent.nlNewThisMonth')}</p>
          <p className="text-2xl font-bold">
            {subscribers.filter(s => {
              const subDate = new Date(s.subscribed_at);
              const now = new Date();
              return subDate.getMonth() === now.getMonth() && subDate.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-medium mb-4">{t('admContent.nlGrowth')}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                name={t('cart.total')}
              />
              <Line 
                type="monotone" 
                dataKey="newSubscribers" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--accent))', strokeWidth: 0, r: 3 }}
                name={t('admContent.nlNew')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function NewsletterManager() {
  const { t } = useTranslation();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [sending, setSending] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    content: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsRes, campsRes] = await Promise.all([
        supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false }),
        supabase.from('newsletter_campaigns').select('*').order('created_at', { ascending: false }),
      ]);

      if (subsRes.error) throw subsRes.error;
      if (campsRes.error) throw campsRes.error;

      setSubscribers(subsRes.data || []);
      setCampaigns(campsRes.data || []);
    } catch (e) {
      console.error('Failed to load newsletter data:', e);
      toast.error(t('admContent.nlLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeSubscribers = subscribers.filter(s => s.status === 'active');

  const handleCreateCampaign = async () => {
    if (!campaignForm.subject || !campaignForm.content) {
      toast.error(t('admContent.nlRequired'));
      return;
    }

    try {
      const { data: campaign, error } = await supabase
        .from('newsletter_campaigns')
        .insert({
          subject: campaignForm.subject,
          content: campaignForm.content,
          recipients_count: activeSubscribers.length,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(t('admContent.nlCreated'));
      setShowCampaignDialog(false);
      setCampaignForm({ subject: '', content: '' });
      loadData();
    } catch (e: any) {
      console.error('Failed to create campaign:', e);
      toast.error(e.message || t('admContent.nlCreateError'));
    }
  };

  const handleSendCampaign = async (campaign: Campaign) => {
    if (!confirm(t('admContent.nlSendConfirm', { subject: campaign.subject, num: activeSubscribers.length }))) {
      return;
    }

    setSending(true);
    try {
      // Update campaign status
      await supabase
        .from('newsletter_campaigns')
        .update({ status: 'sending' })
        .eq('id', campaign.id);

      let sentCount = 0;
      let failedCount = 0;

      // Send emails to all active subscribers
      for (const subscriber of activeSubscribers) {
        try {
          const { error } = await supabase.functions.invoke('send-email', {
            body: {
              type: 'newsletter',
              email: subscriber.email,
              firstName: subscriber.first_name || t('admContent.nlDefaultName'),
              subject: campaign.subject,
              content: campaign.content,
            },
          });

          if (error) throw error;
          sentCount++;
        } catch (e) {
          console.error(`Failed to send to ${subscriber.email}:`, e);
          failedCount++;
        }
      }

      // Update campaign with results
      await supabase
        .from('newsletter_campaigns')
        .update({
          status: 'sent',
          sent_count: sentCount,
          failed_count: failedCount,
          sent_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      toast.success(t('admContent.nlSentResult', { sent: sentCount, failed: failedCount }));
      loadData();
    } catch (e: any) {
      console.error('Failed to send campaign:', e);
      toast.error(e.message || t('admContent.nlSendError'));
      
      await supabase
        .from('newsletter_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaign.id);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSubscriber = async (subscriber: Subscriber) => {
    if (!confirm(t('admContent.nlRemoveConfirm', { email: subscriber.email }))) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', subscriber.id);
      if (error) throw error;
      toast.success(t('admContent.nlRemoved'));
      loadData();
    } catch (e: any) {
      toast.error(e.message || t('admContent.nlRemoveError'));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'secondary', label: t('admContent.nlDraft') },
      sending: { variant: 'outline', label: t('common.sending') },
      sent: { variant: 'default', label: t('admContent.nlSent') },
      failed: { variant: 'destructive', label: t('admContent.nlFailed') },
    };
    const config = variants[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {t('admContent.nlTitle')}
            </CardTitle>
            <CardDescription>{t('admContent.nlSubtitle')}</CardDescription>
          </div>
          <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admCommon.refresh')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="subscribers">
          <TabsList className="mb-4">
            <TabsTrigger value="subscribers" className="gap-2">
              <Users className="w-4 h-4" />
              {t('admContent.nlSubsTab', { num: activeSubscribers.length })}
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Send className="w-4 h-4" />
              {t('admContent.nlCampsTab', { num: campaigns.length })}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('admContent.nlStats')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscribers">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : subscribers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('admContent.nlNoSubs')}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {subscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subscriber.email}</span>
                        <Badge variant={subscriber.status === 'active' ? 'default' : 'secondary'}>
                          {subscriber.status === 'active' ? t('admCommon.active') : t('admContent.nlUnsubscribed')}
                        </Badge>
                      </div>
                      {subscriber.first_name && (
                        <p className="text-xs text-muted-foreground">{subscriber.first_name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t('admContent.nlSince', { date: new Date(subscriber.subscribed_at).toLocaleDateString('lt-LT') })}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSubscriber(subscriber)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="campaigns">
            <div className="mb-4">
              <Button onClick={() => setShowCampaignDialog(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t('admContent.nlNewCampaign')}
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('admContent.nlNoCampaigns')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{campaign.subject}</span>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('admContent.nlRecipients')}: {campaign.recipients_count} | 
                        {t('admContent.nlSent')}: {campaign.sent_count} | 
                        {t('admContent.nlFailed')}: {campaign.failed_count}
                      </p>
                      {campaign.sent_at && (
                        <p className="text-xs text-muted-foreground">
                          {t('admContent.nlSentAt', { date: new Date(campaign.sent_at).toLocaleString('lt-LT') })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setPreviewCampaign(campaign)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {campaign.status === 'draft' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSendCampaign(campaign)}
                          disabled={sending || activeSubscribers.length === 0}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          {t('admContent.nlSend')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <SubscriberGrowthChart subscribers={subscribers} />
          </TabsContent>
        </Tabs>

        {/* Create Campaign Dialog */}
        <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('admContent.nlNewCampaign')}</DialogTitle>
              <DialogDescription>
                {t('admContent.nlWillSend', { num: activeSubscribers.length })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('admContent.nlSubject')} *</Label>
                <Input
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                  placeholder={t('admContent.nlSubjectPh')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('admContent.nlContent')} *</Label>
                <Textarea
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                  placeholder={t('admContent.nlContentPh')}
                  rows={10}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreateCampaign}>
                {t('admContent.nlCreateDraft')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Campaign Dialog */}
        <Dialog open={!!previewCampaign} onOpenChange={() => setPreviewCampaign(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{previewCampaign?.subject}</DialogTitle>
              <DialogDescription>
                {t('admContent.nlPreviewTitle')}
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap max-h-96 overflow-y-auto">
              {previewCampaign?.content}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewCampaign(null)}>
                {t('common.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
