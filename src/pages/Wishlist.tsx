import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Loader2, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice, getProductImage, getEtaString, Product, transformProduct } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

export default function Wishlist() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  const loadWishlist = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id, products(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const wishlistProducts = data
        ?.map((w: any) => w.products)
        .filter(Boolean)
        .map((p: any) => transformProduct(p)) as Product[];

      setProducts(wishlistProducts || []);
    } catch (e) {
      console.error('Failed to load wishlist:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;
    setRemovingId(productId);

    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success(t('wishlist.removed'));
    } catch (e) {
      console.error('Failed to remove from wishlist:', e);
      toast.error(t('common.error'));
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    toast.success(t('cart.added'));
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="container py-12 max-w-4xl">
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h1 className="font-heading text-2xl font-bold mb-4">{t('wishlist.title')}</h1>
            <p className="text-muted-foreground mb-6">{t('wishlist.loginRequired')}</p>
            <Button asChild>
              <Link to="/auth">{t('auth.login')}</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

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
        {/* Back Button */}
        <Link 
          to="/account" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('wishlist.backToAccount')}
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Heart className="w-8 h-8 text-primary" />
              {t('wishlist.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('wishlist.subtitle')}</p>
          </div>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            {products.length} {t('wishlist.items')}
          </Badge>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h2 className="font-heading text-xl font-semibold mb-2">{t('wishlist.empty')}</h2>
            <p className="text-muted-foreground mb-6">{t('wishlist.emptyDesc')}</p>
            <Button asChild>
              <Link to="/produktai/visi">{t('nav.viewConstructors')}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div 
                key={product.id}
                className="bg-card border border-border rounded-xl overflow-hidden group hover:shadow-premium transition-shadow"
              >
                {/* Image */}
                <Link to={`/produktas/${product.slug}`} className="block relative aspect-square overflow-hidden">
                  <img
                    src={getProductImage(product)}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.stock_status === 'preorder' && (
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                      Pre-order
                    </Badge>
                  )}
                  {product.sale_price_eur && product.sale_price_eur < product.price_eur && (
                    <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                      -{Math.round((1 - product.sale_price_eur / product.price_eur) * 100)}%
                    </Badge>
                  )}
                </Link>

                {/* Content */}
                <div className="p-4">
                  <Link to={`/produktas/${product.slug}`} className="block group-hover:text-primary transition-colors">
                    <h3 className="font-semibold line-clamp-2 mb-1">{product.title}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-3">{getEtaString(product)}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    {product.sale_price_eur && product.sale_price_eur < product.price_eur ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-accent">{formatPrice(product.sale_price_eur)}</span>
                        <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price_eur)}</span>
                      </div>
                    ) : (
                      <span className="font-bold text-lg">{formatPrice(product.price_eur)}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleAddToCart(product)}
                      className="flex-1"
                      size="sm"
                      disabled={product.stock_status === 'out_of_stock'}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {t('cart.add')}
                    </Button>
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => removeFromWishlist(product.id)}
                      disabled={removingId === product.id}
                      className="shrink-0"
                    >
                      {removingId === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
