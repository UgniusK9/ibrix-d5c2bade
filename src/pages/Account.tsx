import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, LogOut, Loader2, Tag, Wallet, Gift, Heart, 
  Settings, Package, HelpCircle, Truck, MessageSquare, 
  BookOpen, Star, ChevronRight, Award
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Offer {
  id: string;
  title: string;
  description: string | null;
  type: 'percent' | 'fixed';
  value: number;
  code: string;
  ends_at: string | null;
}

interface WalletData {
  id: string;
  balance_eur: number;
}

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
}

export default function Account() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Load user profile
        const { data: profileData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileData) {
          setUserProfile(profileData);
        }

        // Load user's targeted offers
        const { data: targetedOffers } = await supabase
          .from('offer_targets')
          .select(`
            offer:offers (
              id, title, description, type, value, code, ends_at, active
            )
          `)
          .eq('user_id', user.id);

        if (targetedOffers) {
          const activeOffers = targetedOffers
            .filter((t: unknown) => (t as { offer: { active: boolean } })?.offer?.active)
            .map((t: unknown) => (t as { offer: Offer }).offer);
          setOffers(activeOffers);
        }

        // Load wallet
        const { data: walletData } = await supabase
          .from('wallets')
          .select('id, balance_eur')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (walletData) {
          setWallet(walletData);
        }

        // Load wishlist count
        const { count } = await supabase
          .from('wishlists')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        setWishlistCount(count || 0);
      } catch (e) {
        console.error('Error loading account data:', e);
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

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-8 md:py-12 max-w-6xl">
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-8">{t('account.title')}</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <Card className="border-2 border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-heading font-semibold text-lg">
                    {userProfile?.first_name && userProfile?.last_name 
                      ? `${userProfile.first_name} ${userProfile.last_name}` 
                      : user?.email}
                  </p>
                  <Link to="/account/settings" className="text-sm text-primary hover:underline">
                    {t('account.memberCard')}
                  </Link>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('account.credits')}</p>
                  <p className="text-2xl font-bold">{formatPrice(wallet?.balance_eur || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credits Info Card */}
          <Card className="border-2 border-border bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <h3 className="font-heading font-semibold text-lg mb-2">{t('account.creditsInfo')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('account.creditsDescription')}
              </p>
              <div className="flex gap-3">
                <Button asChild size="sm">
                  <Link to="/account/credits">{t('account.learnMore')}</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/dovanu-kuponai">{t('nav.giftCards')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wishlist Card */}
          <Card className="border-2 border-dashed border-primary/40 bg-gradient-to-br from-rose-50 to-transparent dark:from-rose-950/20">
            <CardContent className="p-6">
              <h3 className="font-heading font-semibold text-lg mb-2 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                {t('account.createWishlist')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('account.wishlistDescription')}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/wishlist">
                  {wishlistCount > 0 
                    ? `${t('account.viewWishlist')} (${wishlistCount})` 
                    : t('account.viewWishlist')}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* My Deals */}
          {offers.length > 0 ? (
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  {t('account.myDeals')}
                </h3>
                <div className="space-y-3">
                  {offers.slice(0, 2).map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{offer.title}</p>
                        <code className="text-xs bg-background px-2 py-0.5 rounded">{offer.code}</code>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">
                        {offer.type === 'percent' ? `-${offer.value}%` : `-${formatPrice(offer.value)}`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-border bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20">
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold text-lg mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  {t('account.rewards')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('account.rewardsDescription')}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/account/credits">{t('account.viewAllRewards')}</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Navigation Links */}
          <Card className="border-2 border-border">
            <CardContent className="p-0">
              <Link 
                to="/uzsakymai" 
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{t('account.orders')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link 
                to="/account/credits" 
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border"
              >
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{t('account.credits')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link 
                to="/wishlist" 
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{t('wishlist.title')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link 
                to="/account/settings" 
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{t('account.settings')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="border-2 border-border">
            <CardContent className="p-6">
              <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                {t('account.help')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  to="/pristatymas" 
                  className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  {t('account.deliveryReturns')}
                </Link>
                <Link 
                  to="/pagalba" 
                  className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  {t('account.faq')}
                </Link>
                <Link 
                  to="/kontaktai" 
                  className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  {t('account.contactUs')}
                </Link>
                <Link 
                  to="/grazinimai" 
                  className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  <Package className="w-4 h-4 text-muted-foreground" />
                  {t('account.returns')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logout */}
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}