import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 10;

export interface RecentlyViewedItem {
  productId: string;
  viewedAt: number;
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedItem[];
        setRecentlyViewed(parsed);
      }
    } catch (error) {
      console.error('Failed to load recently viewed:', error);
    }
  }, []);

  // Save to localStorage
  const saveToStorage = useCallback((items: RecentlyViewedItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save recently viewed:', error);
    }
  }, []);

  // Add a product to recently viewed
  const addProduct = useCallback((productId: string) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists
      const filtered = prev.filter((item) => item.productId !== productId);
      
      // Add to beginning
      const updated = [
        { productId, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Clear all
  const clearAll = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get product IDs (most recent first) - memoized to prevent infinite loops
  const productIds = useMemo(() => recentlyViewed.map((item) => item.productId), [recentlyViewed]);

  return {
    recentlyViewed,
    productIds,
    addProduct,
    clearAll,
  };
}
