import { useState, useEffect } from 'react';
import { Gift, Plus, Search, RefreshCw, Copy, Trash2, DollarSign, Calendar, User, Mail, MailX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface EmailLog {
  id: string;
  recipient_email: string;
  sent_at: string;
  status: string;
  error_message: string | null;
}

interface GiftCard {
  id: string;
  code: string;
  initial_value_eur: number;
  current_balance_eur: number;
  status: string;
  purchased_by_email: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  personal_message: string | null;
  created_at: string;
  expires_at: string | null;
  redeemed_at: string | null;
  email_logs?: EmailLog[];
}

export function GiftCardsManager() {
  const { t } = useTranslation();
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCardValue, setNewCardValue] = useState<number>(25);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    loadGiftCards();
  }, []);

  const loadGiftCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Load email logs for each gift card
      const cardsWithLogs = await Promise.all((data || []).map(async (card) => {
        const { data: logs } = await supabase
          .from('gift_card_email_logs')
          .select('*')
          .eq('gift_card_id', card.id)
          .order('sent_at', { ascending: false });
        return { ...card, email_logs: logs || [] };
      }));
      
      setGiftCards(cardsWithLogs);
    } catch (e) {
      console.error('Failed to load gift cards:', e);
      toast.error(t('admCredits.giftLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const logEmailSend = async (giftCardId: string, email: string, status: 'sent' | 'failed', errorMessage?: string) => {
    try {
      await supabase.from('gift_card_email_logs').insert({
        gift_card_id: giftCardId,
        recipient_email: email,
        status,
        error_message: errorMessage || null,
      });
    } catch (e) {
      console.error('Failed to log email:', e);
    }
  };

  const sendGiftCardEmail = async (card: GiftCard): Promise<boolean> => {
    const emailTo = card.recipient_email;
    if (!emailTo) return false;
    
    try {
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'gift_card',
          email: emailTo,
          data: {
            recipientEmail: emailTo,
            recipientName: card.recipient_name || t('admCredits.giftDefaultRecipient'),
            senderName: 'IBRIX',
            amount: card.initial_value_eur,
            code: card.code,
            personalMessage: card.personal_message || null,
          },
        },
      });
      
      if (emailError) {
        await logEmailSend(card.id, emailTo, 'failed', emailError.message);
        return false;
      }
      
      await logEmailSend(card.id, emailTo, 'sent');
      return true;
    } catch (err: any) {
      await logEmailSend(card.id, emailTo, 'failed', err.message || t('admCredits.giftUnknownError'));
      return false;
    }
  };

  const handleRetryEmail = async (card: GiftCard) => {
    if (!card.recipient_email) {
      toast.error(t('admCredits.giftNoEmail'));
      return;
    }
    
    setSendingEmail(card.id);
    const success = await sendGiftCardEmail(card);
    setSendingEmail(null);
    
    if (success) {
      toast.success(t('admCredits.giftSent', { email: card.recipient_email }));
    } else {
      toast.error(t('admCredits.giftSendError'));
    }
    
    loadGiftCards();
  };

  const handleCreateGiftCard = async () => {
    if (newCardValue < 5) {
      toast.error(t('admCredits.giftMinAmount'));
      return;
    }
    
    setCreating(true);
    try {
      const { data: codeData, error: codeError } = await supabase.rpc('generate_gift_card_code');
      if (codeError) throw codeError;

      const { data: insertedCard, error } = await supabase
        .from('gift_cards')
        .insert({
          code: codeData,
          initial_value_eur: newCardValue,
          current_balance_eur: newCardValue,
          status: 'active',
          recipient_email: recipientEmail || null,
          recipient_name: recipientName || null,
          personal_message: personalMessage || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Send email to recipient if email provided
      if (recipientEmail && insertedCard) {
        const emailSuccess = await sendGiftCardEmail({
          ...insertedCard,
          email_logs: [],
        });
        
        if (emailSuccess) {
          toast.success(t('admCredits.giftCreatedSent', { email: recipientEmail }));
        } else {
          toast.success(t('admCredits.giftCreated', { code: codeData }), {
            description: t('admCredits.giftNotSentDesc'),
          });
        }
      } else {
        toast.success(t('admCredits.giftCreated', { code: codeData }));
      }
      
      setIsCreateOpen(false);
      setNewCardValue(25);
      setRecipientEmail('');
      setRecipientName('');
      setPersonalMessage('');
      loadGiftCards();
    } catch (e: any) {
      console.error('Failed to create gift card:', e);
      toast.error(e.message || t('admCredits.giftCreateError'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gift_cards')
        .update({ status: 'deactivated' })
        .eq('id', id);

      if (error) throw error;
      toast.success(t('admCredits.giftDeactivated'));
      loadGiftCards();
    } catch (e) {
      toast.error(t('admCredits.giftDeactivateError'));
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t('admCommon.codeCopied'));
  };

  const filteredCards = giftCards.filter(card => {
    const matchesSearch = 
      card.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.purchased_by_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: giftCards.length,
    active: giftCards.filter(c => c.status === 'active').length,
    redeemed: giftCards.filter(c => c.status === 'redeemed').length,
    totalValue: giftCards.reduce((sum, c) => sum + c.initial_value_eur, 0),
    outstandingBalance: giftCards.filter(c => c.status === 'active' || c.status === 'redeemed')
      .reduce((sum, c) => sum + c.current_balance_eur, 0),
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('lt-LT');
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('lt-LT', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/30">{t("admCommon.active")}</Badge>;
      case 'redeemed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">{t("admCredits.giftRedeemed")}</Badge>;
      case 'deactivated':
        return <Badge className="bg-muted text-muted-foreground">{t("admCredits.giftStatusDeactivated")}</Badge>;
      case 'expired':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30">{t("admCredits.giftExpired")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmailStatus = (card: GiftCard) => {
    if (!card.recipient_email) return null;
    
    const logs = card.email_logs || [];
    const lastLog = logs[0];
    
    if (!lastLog) {
      return { status: 'not_sent', label: t('admCredits.giftNotSent') };
    }
    
    if (lastLog.status === 'sent') {
      return { status: 'sent', label: t('admCredits.giftSentAt', { time: formatDateTime(lastLog.sent_at) }) };
    }
    
    return { 
      status: 'failed', 
      label: t('admCredits.giftFailedLabel', { err: lastLog.error_message || t('admCredits.giftUnknownError') })
    };
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">{t('admCredits.giftTotal')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatPrice(stats.totalValue)}</p>
                  <p className="text-xs text-muted-foreground">{t('admCredits.giftTotalValue')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">{t('admCredits.giftActivePlural')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatPrice(stats.outstandingBalance)}</p>
                  <p className="text-xs text-muted-foreground">{t('admCredits.giftUnused')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('admCredits.giftSearchPh')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('admCommon.statusLabel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="active">{t('admCredits.giftActivePlural')}</SelectItem>
                <SelectItem value="redeemed">{t('admCredits.giftUsedPlural')}</SelectItem>
                <SelectItem value="deactivated">{t('admCredits.giftDeactivatedPlural')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadGiftCards}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('admCredits.giftCreate')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('admCredits.giftNewTitle')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>{t('admCredits.giftValueLabel')}</Label>
                    <div className="flex gap-2 mt-2">
                      {[10, 25, 50, 100].map(val => (
                        <Button 
                          key={val}
                          type="button"
                          variant={newCardValue === val ? 'default' : 'outline'}
                          onClick={() => setNewCardValue(val)}
                        >
                          {val}€
                        </Button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      value={newCardValue}
                      onChange={(e) => setNewCardValue(Number(e.target.value))}
                      min={5}
                      max={1000}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>{t('admCredits.giftEmailLabel')}</Label>
                    <Input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="gavejo@email.lt"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t('admCredits.giftNameLabel')}</Label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Jonas"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t('admCredits.giftMsgLabel')}</Label>
                    <Input
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value)}
                      placeholder={t('admCredits.giftMsgPh')}
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleCreateGiftCard} disabled={creating} className="w-full">
                    {creating ? t('admCredits.giftCreating') : t('admCredits.giftCreate')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Gift Cards Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              {t('admCredits.giftTitleCount', { num: filteredCards.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
            ) : filteredCards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('admCredits.giftNotFound')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b">
                      <th className="py-3 px-2">{t('admCredits.giftCode')}</th>
                      <th className="py-3 px-2">{t('admCommon.value')}</th>
                      <th className="py-3 px-2">{t('admOrders.ordPayBalance')}</th>
                      <th className="py-3 px-2">{t('admCommon.statusLabel')}</th>
                      <th className="py-3 px-2">{t('admCredits.giftRecipient')}</th>
                      <th className="py-3 px-2">{t('admCredits.giftEmail')}</th>
                      <th className="py-3 px-2">{t('admCommon.created')}</th>
                      <th className="py-3 px-2 text-right">{t('admCommon.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCards.map(card => {
                      const emailStatus = getEmailStatus(card);
                      return (
                        <tr key={card.id} className="border-b hover:bg-muted/30">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                {card.code}
                              </code>
                              <Button variant="ghost" size="icon" onClick={() => copyCode(card.code)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="py-3 px-2 font-medium">{formatPrice(card.initial_value_eur)}</td>
                          <td className="py-3 px-2">
                            <span className={card.current_balance_eur < card.initial_value_eur ? 'text-amber-600' : ''}>
                              {formatPrice(card.current_balance_eur)}
                            </span>
                          </td>
                          <td className="py-3 px-2">{getStatusBadge(card.status)}</td>
                          <td className="py-3 px-2 text-sm">
                            {card.recipient_email || card.recipient_name || '-'}
                          </td>
                          <td className="py-3 px-2">
                            {emailStatus ? (
                              <div className="flex items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger>
                                    {emailStatus.status === 'sent' ? (
                                      <Mail className="w-4 h-4 text-success" />
                                    ) : emailStatus.status === 'failed' ? (
                                      <MailX className="w-4 h-4 text-destructive" />
                                    ) : (
                                      <Mail className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{emailStatus.label}</p>
                                  </TooltipContent>
                                </Tooltip>
                                {(emailStatus.status === 'failed' || emailStatus.status === 'not_sent') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleRetryEmail(card)}
                                    disabled={sendingEmail === card.id}
                                  >
                                    <RotateCcw className={`w-3 h-3 ${sendingEmail === card.id ? 'animate-spin' : ''}`} />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {formatDate(card.created_at)}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {card.recipient_email && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleRetryEmail(card)}
                                      disabled={sendingEmail === card.id}
                                    >
                                      <Mail className={`w-4 h-4 ${sendingEmail === card.id ? 'animate-pulse' : ''}`} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('admCredits.giftSendMail')}</TooltipContent>
                                </Tooltip>
                              )}
                              {card.status === 'active' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleDeactivate(card.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('admCredits.giftDeactivate')}</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}