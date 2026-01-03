import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, User, LogOut, Loader2, Tag } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_eur: number;
  deposit_total_eur: number;
  balance_total_eur: number;
  created_at: string;
}

interface Offer {
  id: string;
  title: string;
  description: string | null;
  type: 'percent' | 'fixed';
  value: number;
  code: string;
  ends_at: string | null;
}

export default function Account() {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Load orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, order_number, status, total_eur, deposit_total_eur, balance_total_eur, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersData) {
          setOrders(ordersData);
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
            .filter((t: any) => t.offer?.active)
            .map((t: any) => t.offer);
          setOffers(activeOffers);
        }
      } catch (e) {
        console.error('Error loading account data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      'created': { label: 'Sukurtas', className: 'bg-muted text-muted-foreground' },
      'deposit_paid': { label: 'Depozitas sumokėtas', className: 'bg-green-500/10 text-green-600' },
      'awaiting_balance': { label: 'Laukia likučio', className: 'bg-yellow-500/10 text-yellow-600' },
      'balance_paid': { label: 'Pilnai apmokėtas', className: 'bg-green-500/10 text-green-600' },
      'packed': { label: 'Supakuotas', className: 'bg-blue-500/10 text-blue-600' },
      'shipped': { label: 'Išsiųstas', className: 'bg-primary/10 text-primary' },
      'delivered': { label: 'Pristatytas', className: 'bg-green-500/10 text-green-600' },
      'cancelled': { label: 'Atšauktas', className: 'bg-destructive/10 text-destructive' },
      'refunded': { label: 'Grąžintas', className: 'bg-muted text-muted-foreground' },
    };
    const c = config[status] || config['created'];
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

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
      <div className="container py-8 md:py-12 max-w-4xl">
        {/* Profile header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{user?.email}</p>
                <p className="text-sm text-muted-foreground">Klientas</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Atsijungti
            </Button>
          </div>
        </div>

        {/* My Deals */}
        {offers.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Mano pasiūlymai
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-card border border-primary/30 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{offer.title}</h3>
                      {offer.description && (
                        <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                      )}
                    </div>
                    <Badge className="bg-primary text-primary-foreground">
                      {offer.type === 'percent' ? `-${offer.value}%` : `-${formatPrice(offer.value)}`}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{offer.code}</code>
                    {offer.ends_at && (
                      <span className="text-xs text-muted-foreground">
                        Galioja iki: {new Date(offer.ends_at).toLocaleDateString('lt-LT')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        <div>
          <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Mano užsakymai
          </h2>

          {orders.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Užsakymų dar nėra</p>
              <Button asChild className="mt-4">
                <Link to="/varikliai">Peržiūrėti produktus</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-mono font-semibold">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('lt-LT')}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Iš viso:</span>
                      <p className="font-semibold">{formatPrice(order.total_eur)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sumokėtas depozitas:</span>
                      <p className="font-semibold text-green-600">{formatPrice(order.deposit_total_eur)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Likutis:</span>
                      <p className="font-semibold text-yellow-600">{formatPrice(order.balance_total_eur)}</p>
                    </div>
                  </div>

                  {order.status === 'awaiting_balance' && (
                    <Button size="sm" className="w-full">
                      Apmokėti likutį ({formatPrice(order.balance_total_eur)})
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
