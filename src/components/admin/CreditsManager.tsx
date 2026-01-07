import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Save, Search, Plus, Minus, Wallet, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditsUsersList } from './CreditsUsersList';

interface CreditSettings {
  earn_rate_percent: number;
  activation_delay_days: number;
  max_redeem_percent: number;
  min_order_subtotal_cents: number;
  exclude_categories: string[];
}

interface UserWallet {
  id: string;
  email: string;
  balance_eur: number;
  wallet_id: string | null;
}

export function CreditsManager() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CreditSettings>({
    earn_rate_percent: 3,
    activation_delay_days: 14,
    max_redeem_percent: 50,
    min_order_subtotal_cents: 1000,
    exclude_categories: ['gift_card'],
  });
  
  // User lookup
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserWallet[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWallet | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .like('key', 'credits.%');

      if (error) throw error;

      if (data) {
        const newSettings: Partial<CreditSettings> = {};
        data.forEach((item) => {
          const shortKey = item.key.replace('credits.', '') as keyof CreditSettings;
          const value = (item.value as { value: any })?.value;
          if (value !== undefined) {
            (newSettings as any)[shortKey] = value;
          }
        });
        setSettings(prev => ({ ...prev, ...newSettings }));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        { key: 'credits.earn_rate_percent', value: { value: settings.earn_rate_percent } },
        { key: 'credits.activation_delay_days', value: { value: settings.activation_delay_days } },
        { key: 'credits.max_redeem_percent', value: { value: settings.max_redeem_percent } },
        { key: 'credits.min_order_subtotal_cents', value: { value: settings.min_order_subtotal_cents } },
        { key: 'credits.exclude_categories', value: { value: settings.exclude_categories } },
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('app_settings')
          .upsert(setting, { onConflict: 'key' });
        if (error) throw error;
      }

      toast.success(t('credits.admin.saved'));
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;
    
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          wallets (
            id,
            balance_eur
          )
        `)
        .ilike('email', `%${searchEmail}%`)
        .limit(10);

      if (error) throw error;

      const results: UserWallet[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        balance_eur: user.wallets?.[0]?.balance_eur || 0,
        wallet_id: user.wallets?.[0]?.id || null,
      }));

      setSearchResults(results);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAdjustment = async (type: 'add' | 'subtract') => {
    if (!selectedUser || !adjustAmount || !adjustReason.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount');
      return;
    }

    setAdjusting(true);
    try {
      // Create or get wallet
      let walletId = selectedUser.wallet_id;
      
      if (!walletId) {
        const { data: newWallet, error: walletError } = await supabase
          .from('wallets')
          .insert({ user_id: selectedUser.id, balance_eur: 0 })
          .select('id')
          .single();
        
        if (walletError) throw walletError;
        walletId = newWallet.id;
      }

      // Get current balance
      const { data: wallet, error: fetchError } = await supabase
        .from('wallets')
        .select('balance_eur')
        .eq('id', walletId)
        .single();

      if (fetchError) throw fetchError;

      const currentBalance = wallet?.balance_eur || 0;
      const newBalance = type === 'add' ? currentBalance + amount : Math.max(0, currentBalance - amount);

      // Update balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance_eur: newBalance })
        .eq('id', walletId);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: walletId,
          type: 'manual_adjustment',
          amount_eur: type === 'add' ? amount : -amount,
          status: 'available',
          reason: adjustReason,
        });

      if (txError) throw txError;

      toast.success(t('credits.admin.adjusted'));
      
      // Update UI
      setSelectedUser(prev => prev ? { ...prev, balance_eur: newBalance, wallet_id: walletId } : null);
      setSearchResults(prev => prev.map(u => 
        u.id === selectedUser.id ? { ...u, balance_eur: newBalance, wallet_id: walletId } : u
      ));
      setAdjustAmount('');
      setAdjustReason('');
    } catch (err) {
      console.error('Error adjusting balance:', err);
      toast.error('Failed to adjust balance');
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          {t('credits.admin.title')}
        </h2>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Nustatymai
          </TabsTrigger>
          <TabsTrigger value="lookup" className="gap-2">
            <Search className="w-4 h-4" />
            Paieška
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Visi vartotojai
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="earnRate">{t('credits.admin.earnRate')}</Label>
              <Input
                id="earnRate"
                type="number"
                min="0"
                max="100"
                value={settings.earn_rate_percent}
                onChange={(e) => setSettings(prev => ({ ...prev, earn_rate_percent: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">{t('credits.admin.earnRateHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activationDelay">{t('credits.admin.activationDelay')}</Label>
              <Input
                id="activationDelay"
                type="number"
                min="0"
                max="365"
                value={settings.activation_delay_days}
                onChange={(e) => setSettings(prev => ({ ...prev, activation_delay_days: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">{t('credits.admin.activationDelayHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRedeem">{t('credits.admin.maxRedeemPercent')}</Label>
              <Input
                id="maxRedeem"
                type="number"
                min="0"
                max="100"
                value={settings.max_redeem_percent}
                onChange={(e) => setSettings(prev => ({ ...prev, max_redeem_percent: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">{t('credits.admin.maxRedeemPercentHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minSubtotal">{t('credits.admin.minSubtotal')}</Label>
              <Input
                id="minSubtotal"
                type="number"
                min="0"
                value={(settings.min_order_subtotal_cents / 100).toFixed(2)}
                onChange={(e) => setSettings(prev => ({ ...prev, min_order_subtotal_cents: Math.round(parseFloat(e.target.value) * 100) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">{t('credits.admin.minSubtotalHelp')}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('credits.admin.excludeCategories')}</Label>
            <Input
              value={settings.exclude_categories.join(', ')}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                exclude_categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }))}
              placeholder="gift_card, other"
            />
            <p className="text-xs text-muted-foreground">{t('credits.admin.excludeCategoriesHelp')}</p>
          </div>

          <Button onClick={saveSettings} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('common.save')}
          </Button>
        </TabsContent>

        <TabsContent value="lookup" className="space-y-6 mt-6">
          <div className="space-y-4">
            <Label>{t('credits.admin.userLookup')}</Label>
            <div className="flex gap-2">
              <Input
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder={t('credits.admin.searchUser')}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              />
              <Button onClick={searchUsers} disabled={searchLoading}>
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y">
              {searchResults.map(user => (
                <div 
                  key={user.id} 
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedUser?.id === user.id ? 'bg-primary/5' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{user.email}</span>
                    <span className="text-success font-semibold">€{user.balance_eur.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedUser.email}</p>
                  <p className="text-sm text-muted-foreground">{t('credits.admin.userBalance')}</p>
                </div>
                <p className="text-2xl font-bold text-success">€{selectedUser.balance_eur.toFixed(2)}</p>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="font-medium">{t('credits.admin.manualAdjust')}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>{t('credits.admin.adjustAmount')}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>{t('credits.admin.adjustReason')}</Label>
                    <Input
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Priežastis..."
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleAdjustment('add')} 
                    disabled={adjusting}
                    className="gap-2 flex-1"
                  >
                    <Plus className="w-4 h-4" />
                    {t('credits.admin.adjustAdd')}
                  </Button>
                  <Button 
                    onClick={() => handleAdjustment('subtract')} 
                    disabled={adjusting}
                    variant="outline"
                    className="gap-2 flex-1"
                  >
                    <Minus className="w-4 h-4" />
                    {t('credits.admin.adjustSubtract')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <CreditsUsersList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
