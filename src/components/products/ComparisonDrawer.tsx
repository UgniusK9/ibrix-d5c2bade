import { X, Trash2, Scale, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useComparisonStore } from '@/stores/comparisonStore';
import { formatPrice, getProductImage, getEtaString } from '@/hooks/useProducts';

export function ComparisonDrawer() {
  const { products, removeProduct, clearAll } = useComparisonStore();

  if (products.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-4 right-4 z-50 shadow-lg gap-2"
          size="lg"
        >
          <Scale className="w-5 h-5" />
          Palyginti ({products.length}/3)
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading text-xl">Produktų palyginimas</SheetTitle>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <Trash2 className="w-4 h-4 mr-2" />
              Išvalyti
            </Button>
          </div>
        </SheetHeader>

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b border-border w-40 text-sm font-medium text-muted-foreground">
                  Savybė
                </th>
                {products.map((product) => (
                  <th key={product.id} className="p-3 border-b border-border min-w-[200px]">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => removeProduct(product.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <img
                        src={getProductImage(product)}
                        alt={product.title}
                        className="w-20 h-20 object-cover rounded-lg mx-auto mb-2"
                      />
                      <p className="font-semibold text-sm line-clamp-2">{product.title}</p>
                    </div>
                  </th>
                ))}
                {/* Empty slots */}
                {Array.from({ length: 3 - products.length }).map((_, i) => (
                  <th key={`empty-${i}`} className="p-3 border-b border-border min-w-[200px]">
                    <div className="w-20 h-20 bg-muted rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm text-muted-foreground">Pridėti produktą</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price */}
              <tr>
                <td className="p-3 border-b border-border text-sm font-medium">Kaina</td>
                {products.map((product) => (
                  <td key={product.id} className="p-3 border-b border-border text-center">
                    <span className="font-bold text-lg text-accent">
                      {formatPrice(product.price_eur)}
                    </span>
                  </td>
                ))}
                {Array.from({ length: 3 - products.length }).map((_, i) => (
                  <td key={`empty-${i}`} className="p-3 border-b border-border text-center text-muted-foreground">
                    —
                  </td>
                ))}
              </tr>
              
              {/* Deposit */}
              <tr>
                <td className="p-3 border-b border-border text-sm font-medium">Depozitas</td>
                {products.map((product) => (
                  <td key={product.id} className="p-3 border-b border-border text-center">
                    <span className="font-semibold text-primary">
                      {formatPrice(product.deposit_eur)}
                    </span>
                  </td>
                ))}
                {Array.from({ length: 3 - products.length }).map((_, i) => (
                  <td key={`empty-${i}`} className="p-3 border-b border-border text-center text-muted-foreground">
                    —
                  </td>
                ))}
              </tr>
              
              {/* Status */}
              <tr>
                <td className="p-3 border-b border-border text-sm font-medium">Būsena</td>
                {products.map((product) => (
                  <td key={product.id} className="p-3 border-b border-border text-center">
                    <Badge variant={product.stock_status === 'in_stock' ? 'default' : 'secondary'}>
                      {product.stock_status === 'preorder' ? 'Pre-order' : 
                       product.stock_status === 'in_stock' ? 'Sandėlyje' : 'Išparduota'}
                    </Badge>
                  </td>
                ))}
                {Array.from({ length: 3 - products.length }).map((_, i) => (
                  <td key={`empty-${i}`} className="p-3 border-b border-border text-center text-muted-foreground">
                    —
                  </td>
                ))}
              </tr>
              
              {/* ETA */}
              <tr>
                <td className="p-3 border-b border-border text-sm font-medium">Pristatymas</td>
                {products.map((product) => (
                  <td key={product.id} className="p-3 border-b border-border text-center text-sm">
                    {getEtaString(product)}
                  </td>
                ))}
                {Array.from({ length: 3 - products.length }).map((_, i) => (
                  <td key={`empty-${i}`} className="p-3 border-b border-border text-center text-muted-foreground">
                    —
                  </td>
                ))}
              </tr>
              
              {/* Details count */}
              <tr>
                <td className="p-3 border-b border-border text-sm font-medium">Detalių sk.</td>
                {products.map((product) => {
                  const detailsCount = (product.details_json as Record<string, unknown>)?.detailsCount as number || 0;
                  return (
                    <td key={product.id} className="p-3 border-b border-border text-center">
                      {detailsCount > 0 ? `${detailsCount} det.` : '—'}
                    </td>
                  );
                })}
                {Array.from({ length: 3 - products.length }).map((_, i) => (
                  <td key={`empty-${i}`} className="p-3 border-b border-border text-center text-muted-foreground">
                    —
                  </td>
                ))}
              </tr>
              
              {/* SKU */}
              <tr>
                <td className="p-3 border-b border-border text-sm font-medium">SKU</td>
                {products.map((product) => (
                  <td key={product.id} className="p-3 border-b border-border text-center font-mono text-xs">
                    {product.sku}
                  </td>
                ))}
                {Array.from({ length: 3 - products.length }).map((_, i) => (
                  <td key={`empty-${i}`} className="p-3 border-b border-border text-center text-muted-foreground">
                    —
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
