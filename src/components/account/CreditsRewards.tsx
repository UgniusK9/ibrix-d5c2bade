import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gift, Loader2, Package, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface RewardProduct {
  id: string;
  title: string;
  slug: string;
  images: string[];
  price_eur: number;
  credits_cost_eur: number;
}

interface CreditsRewardsProps {
  userBalance: number;
}

export function CreditsRewards({ userBalance }: CreditsRewardsProps) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<RewardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, slug, images, price_eur, credits_cost_eur')
          .not('credits_cost_eur', 'is', null)
          .gt('credits_cost_eur', 0)
          .eq('status', 'active')
          .order('credits_cost_eur', { ascending: true })
          .limit(10);

        if (error) throw error;
        
        setProducts((data || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          price_eur: p.price_eur,
          credits_cost_eur: Number(p.credits_cost_eur),
          images: Array.isArray(p.images) ? (p.images as string[]) : [],
        })));
      } catch (err) {
        console.error('Error loading reward products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lt-LT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <Gift className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground mb-4">Šiuo metu nėra produktų, kuriuos galima įsigyti už kreditus</p>
        <Button asChild variant="outline">
          <Link to="/produktai/visi">{t('credits.shopNow')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Gift className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-lg">Rinkiniai už kreditus</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 p-4">
        {products.map((product) => {
          const canAfford = userBalance >= product.credits_cost_eur;
          
          return (
            <Link
              key={product.id}
              to={`/produktas/${product.slug}`}
              className={`group border rounded-xl overflow-hidden hover:shadow-lg transition-all ${
                canAfford ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30' : 'border-border'
              }`}
            >
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {product.images[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                {canAfford && (
                  <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                    Gali įsigyti!
                  </Badge>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {product.title}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground line-through">{formatPrice(product.price_eur)}</p>
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="font-bold text-primary">{formatPrice(product.credits_cost_eur)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">kreditų</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
