import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MockProduct } from '@/data/mockProducts';

export interface CartItem {
  productId: string;
  productHandle: string;
  title: string;
  image: string;
  price: number; // price in cents
  currency: string;
  quantity: number;
  status: 'in-stock' | 'pre-order';
  eta?: string;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean;
  
  // Actions
  addItem: (product: MockProduct, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  setOpen: (open: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isOpen: false,

      addItem: (product, quantity = 1) => {
        const { items } = get();
        
        const existingItem = items.find(i => i.productId === product.id);
        
        if (existingItem) {
          set({
            items: items.map(i =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          });
        } else {
          const newItem: CartItem = {
            productId: product.id,
            productHandle: product.handle,
            title: product.title,
            image: product.image,
            price: product.price,
            currency: product.currency,
            quantity,
            status: product.status,
            eta: product.eta,
          };
          set({ items: [...items, newItem] });
        }
        
        // Open cart drawer when item is added
        set({ isOpen: true });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.productId === productId ? { ...item, quantity } : item
          )
        });
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter(item => item.productId !== productId)
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setOpen: (isOpen) => set({ isOpen }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + (item?.quantity || 0), 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => {
          const price = item?.price || 0;
          const quantity = item?.quantity || 0;
          return sum + (price * quantity);
        }, 0);
      },
    }),
    {
      name: 'ibrix-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Helper to format price (cents to formatted price)
export function formatCartPrice(amountCents: number | string, currencyCode: string = 'EUR'): string {
  const numAmount = typeof amountCents === 'string' ? parseFloat(amountCents) : amountCents;
  // If amount is already in cents, convert to currency units
  const displayAmount = numAmount > 1000 ? numAmount / 100 : numAmount;
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: currencyCode,
  }).format(displayAmount);
}
