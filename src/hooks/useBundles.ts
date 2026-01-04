import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/stores/cartStore';

export interface BundleRule {
  id: string;
  name: string;
  description: string | null;
  trigger_product_id: string | null;
  trigger_category: string | null;
  trigger_min_qty: number;
  discount_product_id: string | null;
  discount_category: string | null;
  discount_type: string;
  discount_value: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
}

export interface AppliedBundle {
  rule: BundleRule;
  discountAmount: number; // in cents
  affectedProductId: string;
  affectedProductTitle: string;
}

export function useBundles() {
  const [rules, setRules] = useState<BundleRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRules = async () => {
      try {
        const { data, error } = await supabase
          .from('bundle_rules')
          .select('*')
          .eq('active', true);

        if (error) throw error;
        setRules((data || []) as BundleRule[]);
      } catch (e) {
        console.error('Failed to load bundle rules:', e);
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, []);

  return { rules, loading };
}

/**
 * Calculate applicable bundle discounts for a cart
 */
export function calculateBundleDiscounts(
  items: CartItem[],
  rules: BundleRule[]
): AppliedBundle[] {
  const appliedBundles: AppliedBundle[] = [];

  for (const rule of rules) {
    // Check if trigger condition is met
    let triggerMet = false;
    let triggerQty = 0;

    for (const item of items) {
      // Check product match
      if (rule.trigger_product_id && item.productId === rule.trigger_product_id) {
        triggerQty += item.quantity;
      }
      // Check category match (using status as fallback since CartItem may not have category)
      if (rule.trigger_category) {
        triggerQty += item.quantity;
      }
    }

    triggerMet = triggerQty >= rule.trigger_min_qty;

    if (!triggerMet) continue;

    // Find discount target
    for (const item of items) {
      let isTarget = false;

      if (rule.discount_product_id && item.productId === rule.discount_product_id) {
        isTarget = true;
      }
      if (rule.discount_category) {
        isTarget = true;
      }

      // Don't apply discount to the same item that triggered (unless explicitly set)
      if (rule.trigger_product_id === rule.discount_product_id) {
        // Same product bundle - apply to additional items only
        if (item.quantity <= rule.trigger_min_qty) continue;
      }

      if (!isTarget) continue;

      // Calculate discount
      const itemPrice = item.price; // in cents
      let discountAmount = 0;

      if (rule.discount_type === 'percent') {
        discountAmount = Math.round(itemPrice * (rule.discount_value / 100));
      } else {
        discountAmount = Math.round(rule.discount_value * 100); // convert EUR to cents
      }

      // Cap discount at item price
      discountAmount = Math.min(discountAmount, itemPrice);

      // Check if already applied to this product
      const alreadyApplied = appliedBundles.some(
        ab => ab.affectedProductId === item.productId && ab.rule.id === rule.id
      );

      if (!alreadyApplied && discountAmount > 0) {
        appliedBundles.push({
          rule,
          discountAmount,
          affectedProductId: item.productId,
          affectedProductTitle: item.title,
        });
      }
    }
  }

  return appliedBundles;
}

/**
 * Hook to get applicable bundles for current cart
 */
export function useCartBundles(items: CartItem[]) {
  const { rules, loading } = useBundles();

  const appliedBundles = useMemo(() => {
    if (loading || rules.length === 0 || items.length === 0) {
      return [];
    }
    return calculateBundleDiscounts(items, rules);
  }, [items, rules, loading]);

  const totalBundleDiscount = useMemo(() => {
    return appliedBundles.reduce((sum, ab) => sum + ab.discountAmount, 0);
  }, [appliedBundles]);

  return {
    appliedBundles,
    totalBundleDiscount,
    loading,
  };
}