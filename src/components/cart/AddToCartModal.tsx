import { useTranslation } from "react-i18next";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, Package, Sparkles, Clock, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCartPrice, type CartItem, useCartStore } from '@/stores/cartStore';
import { useProducts, formatPrice, getProductImage, cleanTitle, getProductName } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
}

export function AddToCartModal({ isOpen, onClose, item }: AddToCartModalProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: allProducts } = useProducts();
  const { items: cartItems, getTotalPrice, addItem } = useCartStore();
  const [recommendations, setRecommendations] = useState<typeof allProducts>([]);

  // Get 3 random recommendations (different from current item and not in cart)
  useEffect(() => {
    if (!allProducts || !item) return;
    
    const cartProductIds = cartItems.map(i => i.productId);
    const otherProducts = allProducts.filter(
      p => p.id !== item.productId && !cartProductIds.includes(p.id)
    );
    const shuffled = [...otherProducts].sort(() => Math.random() - 0.5);
    setRecommendations(shuffled.slice(0, 3));
  }, [allProducts, item, cartItems]);

  const handleViewCart = () => {
    onClose();
    setTimeout(() => navigate('/checkout'), 150);
  };

  const handleContinueShopping = () => {
    onClose();
  };

  const handleAddRecommendation = (product: typeof allProducts[0]) => {
    addItem(product, 1);
  };

  if (!item) return null;

  const cartTotal = getTotalPrice();
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  // CartItem.title is a snapshot from add time; re-localize from the product
  // catalogue so language switches are reflected live.
  const itemProduct = allProducts?.find((p) => p.id === item.productId);
  const localizedItemTitle = itemProduct
    ? getProductName(itemProduct, i18n.language)
    : cleanTitle(item.title, item.sku);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Success header */}
        <div className="bg-success/10 p-5 border-b border-success/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-success">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-heading font-bold">{t('products.addedToCart')}!</p>
                <p className="text-sm font-normal text-muted-foreground">
                  {t('cart.inCart')}: {t('cart.itemCount', { count: itemCount })}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-5">
          {/* Added item */}
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-secondary rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
              {item.image ? (
                <img
                  src={item.image}
                  alt={localizedItemTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold line-clamp-2">{localizedItemTitle}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    item.status === 'in_stock' 
                      ? 'border-success/50 text-success bg-success/5' 
                      : 'border-primary/50 text-primary bg-primary/5'
                  )}
                >
                  {item.status === 'in_stock' ? t('products.inStockLabel') : t('products.preOrderLabel')}
                </Badge>
                {item.eta && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.eta}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-muted-foreground">{t('cart.quantity')}: {item.quantity}</span>
                <span className="font-heading font-bold text-lg">{formatCartPrice(item.price * item.quantity)}</span>
              </div>
            </div>
          </div>

          {/* Cart summary */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <span className="text-sm text-muted-foreground">{t('cart.totalLabel')}</span>
            <span className="font-heading font-bold text-xl">{formatCartPrice(cartTotal)}</span>
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={handleContinueShopping} 
              className="w-full h-12 hover:bg-muted/50"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              {t('cart.continueShopping')}
            </Button>
            <Button 
              onClick={handleViewCart} 
              className="w-full h-12 bg-primary hover:bg-primary/90"
            >
              {t('cart.viewCart')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <>
              <Separator className="my-2" />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <p className="text-sm font-heading font-semibold">{t('cart.frequentlyBought')}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {recommendations.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleAddRecommendation(product)}
                      className="group text-left p-3 border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <div className="aspect-square w-full mb-2 bg-secondary rounded-lg overflow-hidden">
                        <img
                          src={getProductImage(product)}
                          alt={getProductName(product, i18n.language)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-xs font-medium line-clamp-2 min-h-[2.5rem]">{getProductName(product, i18n.language)}</p>
                      <p className="text-xs text-primary font-bold mt-1">{formatPrice(product.price_eur)}</p>
                      <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                        + {t('common.add')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}