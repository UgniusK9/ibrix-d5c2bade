import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Loader2, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { useCartStore, formatCartPrice } from "@/stores/cartStore";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function CartDrawer() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { 
    items, 
    isLoading,
    isOpen,
    setOpen,
    updateQuantity, 
    removeItem, 
    getTotalPrice,
    getTotalItems,
  } = useCartStore();
  
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleCheckout = () => {
    setOpen(false);
    navigate('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
        {/* Header */}
        <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-accent" />
            </div>
            <div>
              <SheetTitle className="font-heading text-xl">{t('cart.title')}</SheetTitle>
              <SheetDescription className="text-sm">
                {totalItems === 0 
                  ? t('cart.empty')
                  : `${totalItems} ${totalItems === 1 ? 'prekė' : 'prekės'}`
                }
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <EmptyState
                variant="cart"
                title={t('cart.emptyTitle') || "Krepšelis tuščias"}
                description={t('cart.emptyDescription') || "Pridėkite konstruktorių, kad pradėtumėte apsipirkimą"}
                actionLabel={t('cart.startShopping') || "Pradėti apsipirkimą"}
                actionHref="/produktai/visi"
              />
            </div>
          ) : (
            <>
              {/* Scrollable items area */}
              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div 
                      key={`${item.productId}-${item.variantId || 'base'}`} 
                      className="flex gap-4 p-4 bg-secondary/50 rounded-xl border border-border"
                    >
                      <Link 
                        to={`/produktas/${item.productSlug}`}
                        onClick={() => setOpen(false)}
                        className="w-20 h-20 bg-card rounded-lg overflow-hidden flex-shrink-0 border border-border hover:border-primary/30 transition-colors"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </Link>
                      
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/produktas/${item.productSlug}`}
                          onClick={() => setOpen(false)}
                          className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors"
                        >
                          {item.title}
                        </Link>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-0.5 ${
                              item.status === 'in_stock' 
                                ? 'border-success/50 text-success bg-success/5' 
                                : 'border-primary/50 text-primary bg-primary/5'
                            }`}
                          >
                            {item.status === 'in_stock' ? t('products.inStock') : t('products.preOrder')}
                          </Badge>
                          {item.eta && (
                            <span className="text-xs text-muted-foreground">
                              {item.eta}
                            </span>
                          )}
                        </div>
                        
                        <p className="font-bold text-base mt-2 text-foreground">
                          {formatCartPrice(item.price, item.currency)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.productId, item.variantId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1 bg-card rounded-lg border border-border">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 rounded-l-lg rounded-r-none"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 rounded-r-lg rounded-l-none"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Fixed checkout section */}
              <div className="flex-shrink-0 p-6 border-t border-border bg-card">
                {/* Free shipping notice */}
                <div className="flex items-center gap-2 justify-center mb-4 p-3 bg-success/10 rounded-lg border border-success/20">
                  <Sparkles className="w-4 h-4 text-success" />
                  <p className="text-sm font-medium text-success">
                    {t('header.freeShipping')}
                  </p>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-base font-medium text-muted-foreground">{t('cart.total')}</span>
                  <span className="text-2xl font-bold font-heading text-foreground">
                    {formatCartPrice(totalPrice, 'EUR')}
                  </span>
                </div>
                
                <Button 
                  onClick={handleCheckout}
                  variant="accent"
                  size="xl"
                  className="w-full"
                  disabled={items.length === 0 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      {t('cart.checkout')}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
