import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet, ArrowLeft, Loader2, Info, Gift, Clock, ShoppingBag, Filter } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

  const getStatusBadge = (status: string) => {
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

        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
          <Wallet className="w-8 h-8 text-primary" />
          {t('credits.title')}
        </h1>

        {/* Balance cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-1">{t('credits.balance')}</p>
            <p className="text-3xl font-bold text-success">{formatPrice(balance)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-1">{t('credits.pending')}</p>
            <p className="text-3xl font-bold text-amber-500">{formatPrice(pendingCredits)}</p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-primary" />
            {t('credits.how.title')}
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <ShoppingBag className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">{t('credits.how.1')}</p>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {t('credits.how.2', { days: activationDays })}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">{t('credits.how.3')}</p>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
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
            <div className="p-8 text-center">
              <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">{t('credits.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isEarnType(tx.type) ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {isEarnType(tx.type) ? '+' : '-'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{getTypeLabel(tx.type)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {getStatusBadge(tx.status || 'available')}
                    <p className={`font-semibold ${isEarnType(tx.type) ? 'text-green-600' : 'text-foreground'}`}>
                      {isEarnType(tx.type) ? '+' : '-'}{formatPrice(tx.amount_eur)}
                    </p>
                    {tx.order_id && (
                      <Link 
                        to={`/account`} 
                        className="text-xs text-primary hover:underline"
                      >
                        {t('credits.table.order')}
                      </Link>
                    )}
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
