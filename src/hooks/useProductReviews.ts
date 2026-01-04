import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  verified_purchase: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

export function useProductReviews(productId: string) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [canReview, setCanReview] = useState(false);
  const { user } = useAuth();

  const loadReviews = useCallback(async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReviews(data || []);
      
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      } else {
        setAverageRating(null);
      }
    } catch (e) {
      console.error('Failed to load reviews:', e);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const checkCanReview = useCallback(async () => {
    if (!user || !productId) {
      setCanReview(false);
      return;
    }

    try {
      // Check if user has purchased this product
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .not('status', 'in', '("cancelled","created")');

      if (!orders || orders.length === 0) {
        setCanReview(false);
        return;
      }

      const orderIds = orders.map(o => o.id);
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', productId)
        .in('order_id', orderIds);

      if (!orderItems || orderItems.length === 0) {
        setCanReview(false);
        return;
      }

      // Check if user already reviewed this product
      const { data: existingReview } = await supabase
        .from('product_reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      setCanReview(!existingReview);
    } catch (e) {
      console.error('Failed to check review eligibility:', e);
      setCanReview(false);
    }
  }, [user, productId]);

  const submitReview = async (rating: number, title: string, content: string) => {
    if (!user || !productId) {
      toast.error('Turite būti prisijungę');
      return false;
    }

    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          title: title.trim() || null,
          content: content.trim() || null,
          verified_purchase: true,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Atsiliepimas išsiųstas patvirtinimui');
      setCanReview(false);
      return true;
    } catch (e: any) {
      console.error('Failed to submit review:', e);
      toast.error(e.message || 'Nepavyko išsiųsti atsiliepimo');
      return false;
    }
  };

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    checkCanReview();
  }, [checkCanReview]);

  return {
    reviews,
    loading,
    averageRating,
    reviewCount: reviews.length,
    canReview,
    submitReview,
    refresh: loadReviews,
  };
}
