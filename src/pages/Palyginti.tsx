import { Link } from 'react-router-dom';
import { Scale, Trash2, ShoppingCart, ExternalLink, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useComparisonStore } from '@/stores/comparisonStore';
import { formatPrice, getProductImage, getEtaString, getProductTitle, getProductShortDesc, type Product } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Palyginti() {
  const { products, removeProduct, clearAll } = useComparisonStore();
  const { t, i18n } = useTranslation();
  const addItem = useCartStore((state) => state.addItem);
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(t("products.addedToCart"), {
      description: getProductTitle(product, i18n.language),
      position: "top-center",
    });
  };

  // Define comparison rows
  const comparisonRows = useMemo(() => [
    {
      key: 'price',
      label: t('comparison.price'),
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
      label: t('comparison.deposit'),
      getValue: (p: Product) => p.deposit_eur,
      render: (product: Product) => (
        <span className="font-semibold text-primary">
          {formatPrice(product.deposit_eur)}
        </span>
      ),
    },
    {
      key: 'balance',
      label: t('comparison.balance'),
      getValue: (p: Product) => p.price_eur - p.deposit_eur,
      render: (product: Product) => (
        <span className="font-medium text-muted-foreground">
          {formatPrice(product.price_eur - product.deposit_eur)}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('comparison.status'),
      getValue: (p: Product) => p.stock_status,
      render: (product: Product) => (
        <Badge 
          variant={product.stock_status === 'in_stock' ? 'default' : 'secondary'}
          className={product.stock_status === 'in_stock' ? 'bg-green-500' : ''}
        >
          {product.stock_status === 'preorder' ? t('products.preOrderLabel') : 
           product.stock_status === 'in_stock' ? t('products.inStockLabel') : t('products.outOfStock')}
        </Badge>
      ),
    },
    {
      key: 'eta',
      label: t('comparison.eta'),
      getValue: (p: Product) => getEtaString(p),
      render: (product: Product) => (
        <span className="text-sm">{getEtaString(product)}</span>
      ),
    },
    {
      key: 'details',
      label: t('comparison.partsCount'),
      getValue: (p: Product) => (p.details_json as Record<string, unknown>)?.detailsCount as number || 0,
      render: (product: Product) => {
        const count = (product.details_json as Record<string, unknown>)?.detailsCount as number || 0;
        return <span>{count > 0 ? `${count} ${t('products.pieces')}` : '—'}</span>;
      },
    },
    {
      key: 'assembly',
      label: t('comparison.assemblyTime'),
      getValue: (p: Product) => (p.details_json as Record<string, unknown>)?.assemblyHours as number || 0,
      render: (product: Product) => {
        const hours = (product.details_json as Record<string, unknown>)?.assemblyHours as number || 0;
        return <span>{hours > 0 ? `${hours} ${t('products.hours')}` : '—'}</span>;
      },
    },
    {
      key: 'dimensions',
      label: t('comparison.dimensions'),
      getValue: (p: Product) => (p.details_json as Record<string, unknown>)?.dimensions as string || '',
      render: (product: Product) => {
        const dims = (product.details_json as Record<string, unknown>)?.dimensions as string || '';
        return <span>{dims || '—'}</span>;
      },
    },
    {
      key: 'weight',
      label: t('comparison.weight'),
      getValue: (p: Product) => (p.details_json as Record<string, unknown>)?.weight as string || '',
      render: (product: Product) => {
        const weight = (product.details_json as Record<string, unknown>)?.weight as string || '';
        return <span>{weight || '—'}</span>;
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
    {
      key: 'category',
      label: t('comparison.category'),
      getValue: (p: Product) => p.category,
      render: (product: Product) => (
        <Badge variant="outline">{product.category}</Badge>
      ),
    },
  ], [t]);

  // Filter rows to show only differences
  const filteredRows = useMemo(() => {
    if (!showDifferencesOnly || products.length < 2) {
      return comparisonRows;
    }
    
    return comparisonRows.filter(row => {
      const values = products.map(p => JSON.stringify(row.getValue(p)));
      const uniqueValues = new Set(values);
      return uniqueValues.size > 1;
    });
  }, [comparisonRows, products, showDifferencesOnly]);

  // Check if row has differences
  const rowHasDifference = (row: typeof comparisonRows[0]) => {
    if (products.length < 2) return false;
    const values = products.map(p => JSON.stringify(row.getValue(p)));
    const uniqueValues = new Set(values);
    return uniqueValues.size > 1;
  };

  return (
    <PageLayout>
      <SEOHead 
        title={t('comparison.title')}
        description={t('pgComparePg.seoDesc')}
        canonical="/palyginti"
      />
      
      <div className="container py-8 md:py-12">
        {/* Back link */}
        <Link 
          to="/produktai/visi" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('comparison.backToConstructors')}
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
              {t('comparison.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('comparison.subtitle')}
            </p>
          </div>
          
          {products.length > 0 && (
            <div className="flex items-center gap-4">
              {/* Differences filter */}
              {products.length >= 2 && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="differences"
                    checked={showDifferencesOnly}
                    onCheckedChange={setShowDifferencesOnly}
                  />
                  <Label htmlFor="differences" className="text-sm cursor-pointer flex items-center gap-1.5">
                    {showDifferencesOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {t('comparison.differencesOnly')}
                  </Label>
                </div>
              )}
              
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                {t('comparison.clear')}
              </Button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {products.length === 0 && (
          <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
            <Scale className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold mb-2">{t('comparison.empty')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('comparison.emptyDesc')}
            </p>
            <Button asChild>
              <Link to="/produktai/visi">{t('nav.viewConstructors')}</Link>
            </Button>
          </div>
        )}

        {/* Comparison table */}
        {products.length > 0 && (
          <div className="overflow-x-auto pb-4">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b border-border w-40 text-sm font-medium text-muted-foreground sticky left-0 bg-background z-10">
                    {t('comparison.property')}
                  </th>
                  {products.map((product) => (
                    <th key={product.id} className="p-4 border-b border-border min-w-[250px] max-w-[320px]">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground z-10"
                          onClick={() => removeProduct(product.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Link to={`/produktas/${product.slug}`} className="group block">
                          <img
                            src={getProductImage(product)}
                            alt={getProductTitle(product, i18n.language)}
                            className="w-32 h-32 object-cover rounded-xl mx-auto mb-3 border border-border group-hover:border-primary transition-colors"
                          />
                          <p className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors mb-3">
                            {getProductTitle(product, i18n.language)}
                          </p>
                        </Link>
                        <div className="flex gap-2 justify-center">
                          <Button 
                            size="sm" 
                            className="text-xs"
                            onClick={() => handleAddToCart(product)}
                          >
                            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                            {t('comparison.toCart')}
                          </Button>
                          <Button 
                            asChild
                            size="sm" 
                            variant="outline"
                            className="text-xs"
                          >
                            <Link to={`/produktas/${product.slug}`}>
                              <ExternalLink className="w-3.5 h-3.5 mr-1" />
                              {t('comparison.open')}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </th>
                  ))}
                  {/* Empty slots */}
                  {Array.from({ length: 3 - products.length }).map((_, i) => (
                    <th key={`empty-${i}`} className="p-4 border-b border-border min-w-[250px]">
                      <div className="w-32 h-32 bg-muted rounded-xl mx-auto mb-3 flex items-center justify-center border-2 border-dashed border-border">
                        <Scale className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                      <p className="text-sm text-muted-foreground">{t('comparison.addConstructor')}</p>
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
                        ${hasDiff && showDifferencesOnly ? 'bg-primary/5' : ''}
                      `}
                    >
                      <td className="p-4 border-b border-border text-sm font-medium sticky left-0 bg-inherit z-10">
                        <span className="flex items-center gap-2">
                          {row.label}
                          {hasDiff && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">
                              {t('comparison.difference')}
                            </Badge>
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
        )}

        {/* Description comparison */}
        {products.length > 0 && products.some(p => getProductShortDesc(p, i18n.language)) && (
          <div className="mt-8 pt-8 border-t">
            <h2 className="font-heading text-xl font-semibold mb-4">{t('comparison.shortDescriptions')}</h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(products.length, 3)}, minmax(200px, 1fr))` }}>
              {products.map((product) => (
                <div key={product.id} className="p-4 bg-muted/50 rounded-xl">
                  <p className="font-medium text-sm mb-2">{getProductTitle(product, i18n.language)}</p>
                  <p className="text-sm text-muted-foreground">{getProductShortDesc(product, i18n.language) || t('comparison.noDescription')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags comparison */}
        {products.length > 0 && products.some(p => p.tags && p.tags.length > 0) && (
          <div className="mt-8 pt-8 border-t">
            <h2 className="font-heading text-xl font-semibold mb-4">{t('comparison.tags')}</h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(products.length, 3)}, minmax(200px, 1fr))` }}>
              {products.map((product) => (
                <div key={product.id} className="p-4 bg-muted/50 rounded-xl">
                  <p className="font-medium text-sm mb-2">{getProductTitle(product, i18n.language)}</p>
                  <div className="flex flex-wrap gap-1">
                    {(product.tags || []).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {(!product.tags || product.tags.length === 0) && (
                      <span className="text-sm text-muted-foreground">{t('comparison.noTags')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
