import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ShopifyProduct, createStorefrontCheckout } from '@/lib/shopify';

export interface CartItem {
  variantId: string; // Shopify variant ID (gid://shopify/ProductVariant/...)
  productId: string;
  productHandle: string;
  title: string;
  variantTitle: string;
  image: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  quantity: number;
  availableForSale: boolean;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean;
  checkoutUrl: string | null;
  
  // Actions
  addItem: (product: ShopifyProduct, variantId?: string, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  setOpen: (open: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  createCheckout: () => Promise<string | null>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isOpen: false,
      checkoutUrl: null,

      addItem: (product, variantId, quantity = 1) => {
        const { items } = get();
        const { node } = product;
        
        // Use first variant if not specified
        const selectedVariant = variantId 
          ? node.variants.edges.find(v => v.node.id === variantId)?.node
          : node.variants.edges[0]?.node;
        
        if (!selectedVariant) {
          console.error('No variant found');
          return;
        }
        
        const existingItem = items.find(i => i.variantId === selectedVariant.id);
        
        if (existingItem) {
          set({
            items: items.map(i =>
              i.variantId === selectedVariant.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          });
        } else {
          const image = node.images.edges[0]?.node?.url || '';
          
          const newItem: CartItem = {
            variantId: selectedVariant.id,
            productId: node.id,
            productHandle: node.handle,
            title: node.title,
            variantTitle: selectedVariant.title,
            image,
            price: selectedVariant.price,
            quantity,
            availableForSale: selectedVariant.availableForSale,
          };
          set({ items: [...items, newItem] });
        }
        
        // Open cart drawer when item is added
        set({ isOpen: true });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.variantId === variantId ? { ...item, quantity } : item
          )
        });
      },

      removeItem: (variantId) => {
        set({
          items: get().items.filter(item => item.variantId !== variantId)
        });
      },

      clearCart: () => {
        set({ items: [], checkoutUrl: null });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setOpen: (isOpen) => set({ isOpen }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + (item?.quantity || 0), 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => {
          const amount = item?.price?.amount ? parseFloat(item.price.amount) : 0;
          const quantity = item?.quantity || 0;
          return sum + (amount * quantity);
        }, 0);
      },

      createCheckout: async () => {
        const { items, setLoading } = get();
        if (items.length === 0) return null;

        setLoading(true);
        try {
          const checkoutItems = items.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity,
          }));
          
          const checkoutUrl = await createStorefrontCheckout(checkoutItems);
          set({ checkoutUrl });
          return checkoutUrl;
        } catch (error) {
          console.error('Failed to create checkout:', error);
          return null;
        } finally {
          setLoading(false);
        }
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
export function formatCartPrice(amount: number | string, currencyCode: string = 'EUR'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: currencyCode,
  }).format(numAmount);
}
