import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, LogOut, Loader2, Tag, Gift, Heart, 
  Settings, Package, HelpCircle, Truck, MessageSquare, 
  BookOpen, ChevronRight, Award, Puzzle, Sparkles, Star
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  username: string | null;
  avatar_url: string | null;
}

export default function Account() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [buildersCount, setBuildersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Load user profile
        const { data: profileData } = await supabase
          .from('users')
          .select('first_name, last_name, username, avatar_url')
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
        const { count: wishCount } = await supabase
          .from('wishlists')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        setWishlistCount(wishCount || 0);

        // Load builders count
        const { count: buildCount } = await supabase
          .from('user_builders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        setBuildersCount(buildCount || 0);
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

  const displayName = userProfile?.first_name && userProfile?.last_name 
    ? `${userProfile.first_name} ${userProfile.last_name}` 
    : user?.email;

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
      <div className="container py-8 md:py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold">{t('account.title')}</h1>
          <p className="text-muted-foreground mt-2">Valdykite savo paskyrą ir stebėkite užsakymus</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-5">
          {/* Profile Card */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-border">
                  {userProfile?.avatar_url ? (
                    <AvatarImage src={userProfile.avatar_url} alt={displayName || ''} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    <User className="w-7 h-7" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-heading font-bold text-xl">
                    {displayName}
                  </p>
                  {userProfile?.username && (
                    <p className="text-sm text-muted-foreground">@{userProfile.username}</p>
                  )}
                  <Link to="/account/settings" className="text-sm text-primary hover:underline mt-1 inline-block">
                    Redaguoti profilį →
                  </Link>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-muted-foreground mb-1">Jūsų kreditai</p>
                  <p className="text-3xl font-bold font-heading text-primary">{formatPrice(wallet?.balance_eur || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Puzzle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{buildersCount}</p>
                  <p className="text-sm text-muted-foreground">Mano konstruktoriai</p>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <Link to="/account/my-builders">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{wishlistCount}</p>
                  <p className="text-sm text-muted-foreground">Norų sąraše</p>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <Link to="/wishlist">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Credits Info Card */}
          <Card className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-lg mb-1">Uždirbkite kreditus</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gaukite 3% kreditų nuo kiekvieno pirkinio ir naudokite juos sekančiam užsakymui.
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link to="/account/credits">Sužinoti daugiau</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/dovanu-kuponai">Dovanų kuponai</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deals or Rewards */}
          {offers.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Jūsų pasiūlymai
                </h3>
                <div className="space-y-3">
                  {offers.slice(0, 2).map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                      <div>
                        <p className="font-semibold text-sm">{offer.title}</p>
                        <code className="text-xs bg-card px-2 py-0.5 rounded border border-border font-mono">{offer.code}</code>
                      </div>
                      <Badge className="bg-accent text-accent-foreground font-bold">
                        {offer.type === 'percent' ? `-${offer.value}%` : `-${formatPrice(offer.value)}`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-accent/5 via-transparent to-transparent">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg mb-1">Apdovanojimai</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Pirkite daugiau ir gaukite specialius pasiūlymus!
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/account/credits">Peržiūrėti</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Links */}
        <div className="grid md:grid-cols-2 gap-5 mt-6">
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <Link 
                to="/orders" 
                className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">Mano užsakymai</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link 
                to="/account/credits" 
                className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-accent" />
                  </div>
                  <span className="font-medium">Kreditai ir apdovanojimai</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link 
                to="/wishlist" 
                className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-destructive" />
                  </div>
                  <span className="font-medium">Norų sąrašas</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link 
                to="/account/my-builders" 
                className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Puzzle className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">Mano konstruktoriai</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link 
                to="/account/settings" 
                className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Settings className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="font-medium">Nustatymai</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Reikia pagalbos?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  to="/pristatymas" 
                  className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium"
                >
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  Pristatymas
                </Link>
                <Link 
                  to="/pagalba" 
                  className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium"
                >
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  D.U.K.
                </Link>
                <Link 
                  to="/kontaktai" 
                  className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  Susisiekite
                </Link>
                <Link 
                  to="/grazinimai" 
                  className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium"
                >
                  <Package className="w-4 h-4 text-muted-foreground" />
                  Grąžinimai
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logout */}
        <div className="mt-8 flex justify-center">
          <Button variant="ghost" onClick={signOut} className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
