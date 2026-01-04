import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useWishlist() {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    if (!user) {
      setWishlistIds([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setWishlistIds(data?.map(w => w.product_id) || []);
    } catch (e) {
      console.error('Failed to load wishlist:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      toast.error('Prisijunkite, kad galėtumėte išsaugoti produktus');
      return;
    }

    const isAdding = !isInWishlist(productId);

    // Optimistic update
    if (isAdding) {
      setWishlistIds(prev => [...prev, productId]);
    } else {
      setWishlistIds(prev => prev.filter(id => id !== productId));
    }

    try {
      if (isAdding) {
        const { error } = await supabase
          .from('wishlists')
          .insert({ user_id: user.id, product_id: productId });
        
        if (error) throw error;
        toast.success('Produktas išsaugotas');
      } else {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        
        if (error) throw error;
        toast.success('Produktas pašalintas');
      }
    } catch (e) {
      // Revert on error
      if (isAdding) {
        setWishlistIds(prev => prev.filter(id => id !== productId));
      } else {
        setWishlistIds(prev => [...prev, productId]);
      }
      console.error('Wishlist error:', e);
      toast.error('Nepavyko atnaujinti norų sąrašo');
    }
  };

  return {
    wishlistIds,
    isInWishlist,
    toggleWishlist,
    loading,
    reload: loadWishlist,
  };
}
