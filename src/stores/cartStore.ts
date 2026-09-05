import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { trackAddToCartEvent } from '@/hooks/useAnalytics';
import type { Product } from '@/hooks/useProducts';
import { getLocalStateStorage } from '@/lib/browser-storage';

export interface CartItem {
  productId: string; // UUID from Supabase
  // SKU is what the Meta/Google catalogues key products on, so analytics events
  // must report it rather than the UUID. Optional because carts persisted before
  // this field existed are still in browsers.
  sku?: string;
  productSlug: string;
  title: string;
  image: string;
  price: number; // price in cents
  deposit: number; // deposit in cents
  currency: string;
  quantity: number;
  status: 'in_stock' | 'preorder';
  eta?: string;
  variantId?: string;
  variantName?: string;
}

interface VariantInfo {
  id: string;
  name: string;
  priceAdjustment: number; // in EUR
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean;
  lastAddedItem: CartItem | null;
  isModalOpen: boolean;
  
  // Actions
  addItem: (product: Product, quantity?: number, variant?: VariantInfo) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  setOpen: (open: boolean) => void;
  setModalOpen: (open: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalDeposit: () => number;
}

// Helper to get ETA string
function getEtaString(product: Product): string {
  if (product.stock_status === 'in_stock') {
    return '1–2 d.d.';
  }
  if (product.preorder_eta_weeks_min && product.preorder_eta_weeks_max) {
    return `${product.preorder_eta_weeks_min}–${product.preorder_eta_weeks_max} sav.`;
  }
  return '8–10 sav.';
}

// Helper to get product image
function getProductImage(product: Product): string {
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop';
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isOpen: false,
      lastAddedItem: null,
      isModalOpen: false,

      addItem: (product, quantity = 1, variant) => {
        const { items } = get();
        
        // Create unique key for product + variant combination
        const itemKey = variant ? `${product.id}-${variant.id}` : product.id;
        const existingItem = items.find(i => 
          variant 
            ? (i.productId === product.id && i.variantId === variant.id)
            : (i.productId === product.id && !i.variantId)
        );
        
        // Use effective price: sale_price_eur if it's lower than price_eur
        const effectiveBasePriceEur = (product.sale_price_eur && product.sale_price_eur < product.price_eur) 
          ? product.sale_price_eur 
          : product.price_eur;
        
        const priceAdjustment = variant?.priceAdjustment || 0;
        const finalPriceEur = effectiveBasePriceEur + priceAdjustment;
        
        const newItem: CartItem = {
          productId: product.id,
          sku: product.sku,
          productSlug: product.slug,
          title: variant ? `${product.title} - ${variant.name}` : product.title,
          image: getProductImage(product),
          price: Math.round(finalPriceEur * 100),
          deposit: Math.round(product.deposit_eur * 100),
          currency: 'EUR',
          quantity,
          status: product.stock_status === 'in_stock' ? 'in_stock' : 'preorder',
          eta: getEtaString(product),
          variantId: variant?.id,
          variantName: variant?.name,
        };
        
        if (existingItem) {
          const updatedItem = { ...existingItem, quantity: existingItem.quantity + quantity };
          set({
            items: items.map(i =>
              (i.productId === product.id && i.variantId === variant?.id) ? updatedItem : i
            ),
            lastAddedItem: updatedItem,
            isModalOpen: true,
          });
        } else {
          set({ 
            items: [...items, newItem],
            lastAddedItem: newItem,
            isModalOpen: true,
          });
        }
        
        // Track AddToCart event. `id` must be the catalogue id (SKU), not the
        // UUID, or Meta cannot match the event to a catalogue product.
        trackAddToCartEvent({
          id: product.sku || product.id,
          name: variant ? `${product.title} - ${variant.name}` : product.title,
          // ProductData.price is in cents; passing euros here reported values
          // 100x too low to Meta and GA.
          price: Math.round(finalPriceEur * 100),
          currency: 'EUR',
          quantity,
        });
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            (item.productId === productId && item.variantId === variantId) 
              ? { ...item, quantity } 
              : item
          )
        });
      },

      removeItem: (productId, variantId) => {
        set({
          items: get().items.filter(item => 
            !(item.productId === productId && item.variantId === variantId)
          )
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setOpen: (isOpen) => set({ isOpen }),
      setModalOpen: (isModalOpen) => set({ isModalOpen }),

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

      getTotalDeposit: () => {
        return get().items.reduce((sum, item) => {
          const deposit = item?.deposit || 0;
          const quantity = item?.quantity || 0;
          return sum + (deposit * quantity);
        }, 0);
      },
    }),
    {
      name: 'ibrix-cart',
      storage: createJSONStorage(getLocalStateStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Helper to format price (cents to formatted price)
export function formatCartPrice(amountCents: number | string, currencyCode: string = 'EUR'): string {
  const numAmount = typeof amountCents === 'string' ? parseFloat(amountCents) : amountCents;
  const displayAmount = numAmount / 100; // Always convert from cents
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: currencyCode,
  }).format(displayAmount);
}
