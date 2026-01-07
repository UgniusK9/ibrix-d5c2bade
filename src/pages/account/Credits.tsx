import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Wallet, 
  ArrowLeft, 
  Loader2, 
  Info, 
  Gift, 
  Clock, 
  ShoppingBag, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  Timer,
  Sparkles
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditsRewards } from '@/components/account/CreditsRewards';
import { RedeemGiftCard } from '@/components/account/RedeemGiftCard';

interface WalletTransaction {
  id: string;
  type: string;
  amount_eur: number;
  status: string;
  order_id: string | null;
  reason: string | null;
  created_at: string;
}

interface AppSetting {
  key: string;
  value: { value: number | string[] };
}

export default function Credits() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [pendingCredits, setPendingCredits] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [settings, setSettings] = useState<Record<string, number | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'redeemed'>('all');

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Load wallet balance
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance_eur')
          .eq('user_id', user.id)
          .maybeSingle();

        if (walletData) {
          setBalance(walletData.balance_eur);
        }

        // Load wallet transactions
        const { data: walletRecord } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (walletRecord) {
          const { data: txData } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', walletRecord.id)
            .order('created_at', { ascending: false });

          if (txData) {
            setTransactions(txData);
            
            // Calculate pending credits
            const pending = txData
              .filter(tx => tx.type === 'earn_pending' || (tx.type === 'credit' && tx.status === 'pending'))
              .reduce((sum, tx) => sum + tx.amount_eur, 0);
            setPendingCredits(pending);
          }
        }

        // Load settings
        const { data: settingsData } = await supabase
          .from('app_settings')
          .select('key, value')
          .like('key', 'credits.%');

        if (settingsData) {
          const settingsMap: Record<string, number | string[]> = {};
          settingsData.forEach((s: AppSetting) => {
            const shortKey = s.key.replace('credits.', '');
            settingsMap[shortKey] = s.value.value;
          });
          setSettings(settingsMap);
        }
      } catch (err) {
        console.error('Error loading credits data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lt-LT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('lt-LT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'earn_pending':
      case 'earn_available':
      case 'credit':
        return t('credits.type.earn');
      case 'redeem_hold':
      case 'redeem_captured':
      case 'debit':
        return t('credits.type.redeem');
      case 'earn_reversed':
        return t('credits.status.reversed');
      case 'manual_adjustment':
        return t('credits.type.adjustment');
      default:
        return type;
    }
  };

  const getStatusIcon = (status: string, type: string) => {
    if (type === 'earn_pending') {
      return <Timer className="h-4 w-4 text-amber-500" />;
    }
    switch (status) {
      case 'pending':
        return <Timer className="h-4 w-4 text-amber-500" />;
      case 'available':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'reversed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'captured':
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string, type: string) => {
    if (type === 'earn_pending') {
      return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">{t('credits.status.pending')}</Badge>;
    }
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">{t('credits.status.pending')}</Badge>;
      case 'available':
        return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">{t('credits.status.available')}</Badge>;
      case 'reversed':
        return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">{t('credits.status.reversed')}</Badge>;
      case 'captured':
        return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">{t('credits.status.captured')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isEarnType = (type: string) => ['earn_pending', 'earn_available', 'credit'].includes(type);
  const isRedeemType = (type: string) => ['redeem_hold', 'redeem_captured', 'debit'].includes(type);

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'earned') return isEarnType(tx.type);
    if (filter === 'redeemed') return isRedeemType(tx.type);
    return true;
  });

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  const activationDays = typeof settings.activation_delay_days === 'number' ? settings.activation_delay_days : 14;
  const earnRate = typeof settings.earn_rate_percent === 'number' ? settings.earn_rate_percent : 3;

  return (
    <PageLayout>
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <Link 
          to="/account" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">
              {t('credits.title')}
            </h1>
            <p className="text-muted-foreground text-sm">{t('credits.subtitle')}</p>
          </div>
        </div>

        {/* Balance cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">{t('credits.balance')}</p>
            </div>
            <p className="text-4xl font-bold text-green-700 dark:text-green-200">{formatPrice(balance)}</p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-2">{t('credits.availableNow')}</p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('credits.pending')}</p>
            </div>
            <p className="text-4xl font-bold text-amber-700 dark:text-amber-200">{formatPrice(pendingCredits)}</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-2">
              {t('credits.pendingHint', { days: activationDays })}
            </p>
        </div>

        {/* Redeem Gift Card */}
        <div className="mb-8">
          <RedeemGiftCard onSuccess={() => {
            // Reload balance after redemption
            window.location.reload();
          }} />
        </div>
        </div>

        {/* How it works */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-6">
            <Info className="w-5 h-5 text-primary" />
            {t('credits.how.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-medium mb-2">{t('credits.how.step1Title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('credits.how.1', { percent: earnRate })}
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                <Clock className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="font-medium mb-2">{t('credits.how.step2Title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('credits.how.2', { days: activationDays })}
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                <Gift className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="font-medium mb-2">{t('credits.how.step3Title')}</h3>
              <p className="text-sm text-muted-foreground">{t('credits.how.3')}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {balance > 0 && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TrendingUp className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold">{t('credits.readyToUse')}</p>
                <p className="text-sm text-muted-foreground">{t('credits.useAtCheckout')}</p>
              </div>
            </div>
            <Button asChild>
              <Link to="/produktai/visi">{t('credits.shopNow')}</Link>
            </Button>
          </div>
        )}

        {/* Rewards - Products for credits */}
        <CreditsRewards userBalance={balance} />

        {/* Transaction history */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="font-semibold text-lg">
              {t('credits.history')}
            </h2>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs px-3">{t('common.all')}</TabsTrigger>
                <TabsTrigger value="earned" className="text-xs px-3">{t('credits.type.earn')}</TabsTrigger>
                <TabsTrigger value="redeemed" className="text-xs px-3">{t('credits.type.redeem')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground mb-4">{t('credits.empty')}</p>
              <Button asChild variant="outline">
                <Link to="/produktai/visi">{t('credits.startEarning')}</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isEarnType(tx.type) 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {isEarnType(tx.type) ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{getTypeLabel(tx.type)}</p>
                          {getStatusIcon(tx.status || 'available', tx.type)}
                        </div>
                        <p className="text-sm text-muted-foreground">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className={`font-bold text-lg ${
                        isEarnType(tx.type) ? 'text-green-600' : 'text-foreground'
                      }`}>
                        {isEarnType(tx.type) ? '+' : '-'}{formatPrice(tx.amount_eur)}
                      </p>
                      {getStatusBadge(tx.status || 'available', tx.type)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
