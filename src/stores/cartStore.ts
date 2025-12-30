import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MockProduct } from '@/data/mockProducts';

// Generate or get session ID
function getSessionId(): string {
  const key = 'ibrix-session-id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export interface CartItem {
  id: string; // cart_item id from DB (used for local state only)
  productId: string;
  title: string;
  slug: string;
  image: string;
  priceCents: number;
  currency: string;
  quantity: number;
  type: 'in_stock' | 'pre_order';
  eta?: string;
  sku: string;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean;
  sessionId: string;
  
  // Actions
  addItem: (product: MockProduct, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  setOpen: (open: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalPriceCents: () => number;
  getSessionId: () => string;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isOpen: false,
      sessionId: '',

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
            id: crypto.randomUUID(),
            productId: product.id,
            title: product.title,
            slug: product.handle,
            image: product.image,
            priceCents: Math.round(product.price * 100),
            currency: product.currency,
            quantity,
            type: product.status === 'pre-order' ? 'pre_order' : 'in_stock',
            eta: product.eta,
            sku: product.sku,
          };
          set({ items: [...items, newItem] });
        }
        
        // Open cart drawer when item is added
        set({ isOpen: true });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          )
        });
      },

      removeItem: (itemId) => {
        set({
          items: get().items.filter(item => item.id !== itemId)
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setOpen: (isOpen) => set({ isOpen }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + ((item.priceCents / 100) * item.quantity), 0);
      },

      getTotalPriceCents: () => {
        return get().items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
      },

      getSessionId: () => {
        return getSessionId();
      },
    }),
    {
      name: 'ibrix-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Helper to format price
export function formatCartPrice(cents: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: currency,
  }).format(cents / 100);
}
