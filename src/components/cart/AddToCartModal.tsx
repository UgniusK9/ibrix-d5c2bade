import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCartPrice, type CartItem } from '@/stores/cartStore';
import { useProducts, formatPrice, getProductImage } from '@/hooks/useProducts';

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
}

export function AddToCartModal({ isOpen, onClose, item }: AddToCartModalProps) {
  const navigate = useNavigate();
  const { data: allProducts } = useProducts();
  const [recommendations, setRecommendations] = useState<typeof allProducts>([]);

  // Get 2 random recommendations (different from current item)
  useEffect(() => {
    if (!allProducts || !item) return;
    
    const otherProducts = allProducts.filter(p => p.id !== item.productId);
    const shuffled = [...otherProducts].sort(() => Math.random() - 0.5);
    setRecommendations(shuffled.slice(0, 2));
  }, [allProducts, item]);

  const handleViewCart = () => {
    onClose();
    // Small delay to let modal close animation complete
    setTimeout(() => {
      navigate('/checkout');
    }, 150);
  };

  const handleContinueShopping = () => {
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            Įtraukta į krepšelį
          </DialogTitle>
        </DialogHeader>

        {/* Added item */}
        <div className="flex gap-4 p-4 bg-muted/30 rounded-xl">
          <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{item.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="outline" 
                className={`text-xs ${item.status === 'in_stock' ? 'border-green-500/50 text-green-600' : 'border-primary/50 text-primary'}`}
              >
                {item.status === 'in_stock' ? 'Sandėlyje' : 'Pre-order'}
              </Badge>
              {item.eta && (
                <span className="text-xs text-muted-foreground">
                  {item.eta}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">Kiekis: {item.quantity}</span>
              <span className="font-bold">{formatCartPrice(item.price * item.quantity)}</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleContinueShopping} className="w-full">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Tęsti apsipirkimą
          </Button>
          <Button onClick={handleViewCart} className="w-full bg-primary hover:bg-primary/90">
            Peržiūrėti krepšelį
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-3">Jums gali patikti</p>
            <div className="grid grid-cols-2 gap-3">
              {recommendations.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    onClose();
                    navigate(`/produktas/${product.slug}`);
                  }}
                  className="text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="aspect-square w-full mb-2 bg-secondary rounded-lg overflow-hidden">
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-medium line-clamp-2">{product.title}</p>
                  <p className="text-xs text-primary font-bold mt-1">{formatPrice(product.price_eur)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
