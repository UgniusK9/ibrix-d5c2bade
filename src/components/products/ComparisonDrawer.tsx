import { X, Trash2, Scale, Package, Clock, ShoppingCart, ExternalLink, Eye, EyeOff, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useComparisonStore } from '@/stores/comparisonStore';
import { formatPrice, getProductImage, getEtaString, type Product } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

export function ComparisonDrawer() {
  const { products, removeProduct, clearAll } = useComparisonStore();
  const addItem = useCartStore((state) => state.addItem);
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);

  if (products.length === 0) return null;

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success("Pridėta į krepšelį", {
      description: product.title,
      position: "top-center",
    });
  };

  // Get comparison rows with all specifications
  const comparisonRows = [
    {
      key: 'price',
      label: 'Kaina',
      getValue: (p: Product) => p.sale_price_eur || p.price_eur,
      render: (product: Product) => (
        <div className="flex flex-col items-center gap-1">
          {product.sale_price_eur ? (
            <>
              <span className="font-bold text-lg text-red-500">
                {formatPrice(product.sale_price_eur)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.price_eur)}
              </span>
            </>
          ) : (
            <span className="font-bold text-lg text-accent">
              {formatPrice(product.price_eur)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'deposit',
      label: 'Depozitas',
      getValue: (p: Product) => p.deposit_eur,
      render: (product: Product) => (
        <span className="font-semibold text-primary">
          {formatPrice(product.deposit_eur)}
        </span>
      ),
    },
    {
      key: 'balance',
      label: 'Likutis',
      getValue: (p: Product) => p.price_eur - p.deposit_eur,
      render: (product: Product) => (
        <span className="font-medium text-muted-foreground">
          {formatPrice(product.price_eur - product.deposit_eur)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Būsena',
      getValue: (p: Product) => p.stock_status,
      render: (product: Product) => (
        <Badge 
          variant={product.stock_status === 'in_stock' ? 'default' : 'secondary'}
          className={product.stock_status === 'in_stock' ? 'bg-green-500' : ''}
        >
          {product.stock_status === 'preorder' ? 'Pre-order' : 
           product.stock_status === 'in_stock' ? 'Sandėlyje' : 'Išparduota'}
        </Badge>
      ),
    },
    {
      key: 'eta',
      label: 'Pristatymas',
      getValue: (p: Product) => getEtaString(p),
      render: (product: Product) => (
        <span className="flex items-center gap-1.5 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          {getEtaString(product)}
        </span>
      ),
    },
    {
      key: 'details',
      label: 'Detalių sk.',
      getValue: (p: Product) => (p.details_json as Record<string, unknown>)?.detailsCount as number || 0,
      render: (product: Product) => {
        const detailsCount = (product.details_json as Record<string, unknown>)?.detailsCount as number || 0;
        return (
          <span className="flex items-center gap-1.5 text-sm">
            <Package className="w-4 h-4 text-muted-foreground" />
            {detailsCount > 0 ? `${detailsCount} det.` : '—'}
          </span>
        );
      },
    },
    {
      key: 'assembly',
      label: 'Surinkimo laikas',
      getValue: (p: Product) => (p.details_json as Record<string, unknown>)?.assemblyHours as number || 0,
      render: (product: Product) => {
        const assemblyHours = (product.details_json as Record<string, unknown>)?.assemblyHours as number || 0;
        return assemblyHours > 0 ? `${assemblyHours} val.` : '—';
      },
    },
    {
      key: 'dimensions',
      label: 'Matmenys',
      getValue: (p: Product) => (p.details_json as Record<string, unknown>)?.dimensions as string || '',
      render: (product: Product) => {
        const dimensions = (product.details_json as Record<string, unknown>)?.dimensions as string || '';
        return dimensions || '—';
      },
    },
    {
      key: 'weight',
      label: 'Svoris',
      getValue: (p: Product) => (p.details_json as Record<string, unknown>)?.weight as string || '',
      render: (product: Product) => {
        const weight = (product.details_json as Record<string, unknown>)?.weight as string || '';
        return weight || '—';
      },
    },
    {
      key: 'sku',
      label: 'SKU',
      getValue: (p: Product) => p.sku,
      render: (product: Product) => (
        <span className="font-mono text-xs">{product.sku}</span>
      ),
    },
  ];

  // Check if row has differences
  const rowHasDifference = (row: typeof comparisonRows[0]) => {
    if (products.length < 2) return false;
    const values = products.map(p => JSON.stringify(row.getValue(p)));
    const uniqueValues = new Set(values);
    return uniqueValues.size > 1;
  };

  // Filter rows based on differences toggle
  const filteredRows = showDifferencesOnly && products.length >= 2
    ? comparisonRows.filter(row => rowHasDifference(row))
    : comparisonRows;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-4 right-4 z-50 shadow-xl gap-2 bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Scale className="w-5 h-5" />
          Palyginti ({products.length}/3)
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SheetTitle className="font-heading text-xl">Produktų palyginimas</SheetTitle>
            <div className="flex items-center gap-4">
              {/* Differences filter */}
              {products.length >= 2 && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="diff-toggle"
                    checked={showDifferencesOnly}
                    onCheckedChange={setShowDifferencesOnly}
                  />
                  <Label htmlFor="diff-toggle" className="text-sm cursor-pointer flex items-center gap-1.5">
                    {showDifferencesOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    Tik skirtumai
                  </Label>
                </div>
              )}
              
              {/* Full page link */}
              <Button asChild variant="outline" size="sm">
                <Link to="/palyginti">
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Pilnas vaizdas
                </Link>
              </Button>
              
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Išvalyti
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Comparison table */}
        <div className="overflow-x-auto pb-4">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr>
                <th className="text-left p-4 border-b border-border w-40 text-sm font-medium text-muted-foreground sticky left-0 bg-background">
                  Savybė
                </th>
                {products.map((product) => (
                  <th key={product.id} className="p-4 border-b border-border min-w-[220px] max-w-[280px]">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeProduct(product.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Link to={`/produktas/${product.slug}`} className="group block">
                        <img
                          src={getProductImage(product)}
                          alt={product.title}
                          className="w-24 h-24 object-cover rounded-xl mx-auto mb-3 border border-border group-hover:border-primary transition-colors"
                        />
                        <p className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
                          {product.title}
                        </p>
                      </Link>
                      <div className="flex gap-2 justify-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleAddToCart(product)}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                          Į krepšelį
                        </Button>
                        <Button 
                          asChild
                          size="sm" 
                          variant="ghost"
                          className="text-xs"
                        >
                          <Link to={`/produktas/${product.slug}`}>
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            Peržiūrėti
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </th>
                ))}
                {/* Empty slots */}
                {Array.from({ length: 3 - products.length }).map((_, i) => (
                  <th key={`empty-${i}`} className="p-4 border-b border-border min-w-[220px]">
                    <div className="w-24 h-24 bg-muted rounded-xl mx-auto mb-3 flex items-center justify-center border-2 border-dashed border-border">
                      <Scale className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm text-muted-foreground">Pridėkite produktą</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, rowIndex) => {
                const hasDiff = rowHasDifference(row);
                return (
                  <tr 
                    key={row.key} 
                    className={`
                      ${rowIndex % 2 === 0 ? 'bg-muted/30' : ''}
                      ${hasDiff ? 'bg-primary/5' : ''}
                    `}
                  >
                    <td className="p-4 border-b border-border text-sm font-medium sticky left-0 bg-inherit">
                      <span className="flex items-center gap-2">
                        {row.label}
                        {hasDiff && (
                          <span className="w-2 h-2 rounded-full bg-primary" title="Skirtumas" />
                        )}
                      </span>
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 border-b border-border text-center">
                        {row.render(product)}
                      </td>
                    ))}
                    {Array.from({ length: 3 - products.length }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4 border-b border-border text-center text-muted-foreground">
                        —
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Description comparison */}
        {products.some(p => p.short_desc) && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-heading font-semibold mb-4">Trumpi aprašymai</h3>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(200px, 1fr))` }}>
              {products.map((product) => (
                <div key={product.id} className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm mb-2">{product.title}</p>
                  <p className="text-sm text-muted-foreground">{product.short_desc || 'Aprašymas nepateiktas'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags comparison */}
        {products.some(p => p.tags && p.tags.length > 0) && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-heading font-semibold mb-4">Žymės</h3>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(200px, 1fr))` }}>
              {products.map((product) => (
                <div key={product.id} className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm mb-2">{product.title}</p>
                  <div className="flex flex-wrap gap-1">
                    {(product.tags || []).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {(!product.tags || product.tags.length === 0) && (
                      <span className="text-sm text-muted-foreground">Žymių nėra</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}