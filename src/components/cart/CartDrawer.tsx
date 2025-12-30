import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Loader2, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartStore, formatCartPrice } from "@/stores/cartStore";
import { useNavigate } from "react-router-dom";

export function CartDrawer() {
  const navigate = useNavigate();
  const { 
    items, 
    isLoading,
    isOpen,
    setOpen,
    updateQuantity, 
    removeItem, 
    getTotalPrice,
  } = useCartStore();
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = getTotalPrice();
  const hasPreorder = items.some(item => item.type === 'pre_order');

  const handleCheckout = () => {
    setOpen(false);
    navigate('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="font-heading">Krepšelis</SheetTitle>
          <SheetDescription>
            {totalItems === 0 
              ? "Jūsų krepšelis tuščias" 
              : `${totalItems} ${totalItems === 1 ? 'prekė' : totalItems < 10 ? 'prekės' : 'prekių'} krepšelyje`
            }
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Jūsų krepšelis tuščias</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Pridėkite prekių iš mūsų kolekcijos
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable items area */}
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${item.type === 'pre_order' ? 'border-primary/50 text-primary' : 'border-success/50 text-success'}`}
                          >
                            {item.type === 'pre_order' ? 'Pre-order' : 'Sandėlyje'}
                          </Badge>
                          {item.type === 'pre_order' && item.eta && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {item.eta}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-sm mt-1">
                          {formatCartPrice(item.priceCents, item.currency)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Pre-order notice */}
              {hasPreorder && (
                <div className="flex-shrink-0 bg-primary/5 border border-primary/20 rounded-lg p-3 mt-4">
                  <p className="text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Pre-order prekės bus pristatytos per nurodytą laiką. Atšaukti galima iki išsiuntimo.
                  </p>
                </div>
              )}
              
              {/* Fixed checkout section */}
              <div className="flex-shrink-0 space-y-4 pt-4 border-t bg-background mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium">Viso</span>
                  <span className="text-xl font-bold font-heading">
                    {formatCartPrice(Math.round(totalPrice * 100), 'EUR')}
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  Nemokamas pristatymas į paštomatą
                </p>
                
                <Button 
                  onClick={handleCheckout}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
                  size="lg"
                  disabled={items.length === 0 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kraunama...
                    </>
                  ) : (
                    <>
                      Pereiti į apmokėjimą
                      <ArrowRight className="w-4 h-4 ml-2" />
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
