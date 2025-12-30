import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Loader2 } from "lucide-react";
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
                    <div key={item.productId} className="flex gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ShoppingCart className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.title}
                        </h4>
                        {item.eta && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Pristatymas: {item.eta}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${item.status === 'in-stock' ? 'border-success/50 text-success' : 'border-primary/50 text-primary'}`}
                          >
                            {item.status === 'in-stock' ? 'Sandėlyje' : 'Pre-order'}
                          </Badge>
                        </div>
                        <p className="font-semibold text-sm mt-1">
                          {formatCartPrice(item.price, item.currency)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
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
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
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
              <div className="flex-shrink-0 space-y-4 pt-4 border-t bg-background mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium">Viso</span>
                  <span className="text-xl font-bold font-heading">
                    {formatCartPrice(totalPrice, 'EUR')}
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
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Pereiti į apmokėjimą
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
