import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/hooks/useProducts';
import { getLocalStateStorage } from '@/lib/browser-storage';

interface ComparisonStore {
  products: Product[];
  addProduct: (product: Product) => boolean;
  removeProduct: (productId: string) => void;
  clearAll: () => void;
  isInComparison: (productId: string) => boolean;
}

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      products: [],
      
      addProduct: (product: Product) => {
        const { products } = get();
        if (products.length >= 3) {
          return false; // Max 3 products
        }
        if (products.some(p => p.id === product.id)) {
          return false; // Already in comparison
        }
        set({ products: [...products, product] });
        return true;
      },
      
      removeProduct: (productId: string) => {
        set(state => ({
          products: state.products.filter(p => p.id !== productId)
        }));
      },
      
      clearAll: () => {
        set({ products: [] });
      },
      
      isInComparison: (productId: string) => {
        return get().products.some(p => p.id === productId);
      },
    }),
    {
      name: 'product-comparison',
      storage: createJSONStorage(getLocalStateStorage),
    }
  )
);
