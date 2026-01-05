import { useEffect, useState } from 'react';
import { Heart, Loader2, Package, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, getProductImage, Product, getEtaString } from '@/hooks/useProducts';
import { toast } from 'sonner';

export function WishlistSection() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id, products(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const wishlistProducts = data
        ?.map((w: any) => w.products)
        .filter(Boolean)
        .map((p: any) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images : 
                  typeof p.images === 'string' ? JSON.parse(p.images) : []
        })) as Product[];

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

    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Produktas pašalintas iš norų sąrašo');
    } catch (e) {
      console.error('Failed to remove from wishlist:', e);
      toast.error('Nepavyko pašalinti produkto');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-primary" />
        Norų sąrašas
      </h3>

      {products.length === 0 ? (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Jūsų norų sąrašas tuščias</p>
          <Button asChild variant="outline">
            <Link to="/produktai/visi">Peržiūrėti konstruktorius</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div 
              key={product.id}
              className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Link to={`/produktas/${product.slug}`}>
                <img
                  src={getProductImage(product)}
                  alt={product.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/produktas/${product.slug}`} className="hover:text-primary transition-colors">
                  <p className="font-medium text-sm line-clamp-1">{product.title}</p>
                </Link>
                <p className="text-xs text-muted-foreground">{getEtaString(product)}</p>
                <p className="font-semibold text-accent mt-1">{formatPrice(product.price_eur)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFromWishlist(product.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
