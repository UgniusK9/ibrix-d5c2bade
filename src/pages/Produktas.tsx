import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Package, Clock, Truck, RotateCcw, Shield, ShoppingCart, Puzzle, HelpCircle, Loader2, Star, Scale, Check, Gift, Landmark } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProduct, formatPrice, getProductImage, getProductTitle, getProductShortDesc, getProductDescription, getDisplayTitle, getDeliveryWindow, formatDeliveryWindow, getChristmasFit, getProductName } from "@/hooks/useProducts";
import { useProductReviews } from "@/hooks/useProductReviews";
import { useProductVariants, groupVariantsByType, type ProductVariant } from "@/hooks/useProductVariants";
import { VariantSelector } from "@/components/products/VariantSelector";
import { useCartStore } from "@/stores/cartStore";
import { useComparisonStore } from "@/stores/comparisonStore";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useTrackProductView } from "@/hooks/useTrackProductView";
import { toast } from "sonner";
import { trackViewContentEvent } from "@/hooks/useAnalytics";
import { SEOHead } from "@/components/seo/SEOHead";
import { ProductReviews } from "@/components/products/ProductReviews";
import { RelatedProducts } from "@/components/home/RelatedProducts";
import {
  PremiumAccordion,
  PremiumAccordionItem,
  PremiumAccordionTrigger,
  PremiumAccordionContent,
  AccordionList,
  AccordionListItem,
  AccordionSpecTable,
  AccordionFaqItem,
} from "@/components/products/PremiumAccordion";

// Trust items and box contents are now translatable via t() function

const productFAQKeys = [
  { q: 'pgProductX.faqQ1', a: 'pgProductX.faqA1' },
  { q: 'pgProductX.faqQ2', a: 'pgProductX.faqA2' },
  { q: 'pgProductX.faqQ3', a: 'pgProductX.faqA3' },
];

export default function Produktas() {
  const { handle } = useParams<{ handle: string }>();
  const { t, i18n } = useTranslation();
  const addItem = useCartStore((state) => state.addItem);
  const { addProduct: addToRecentlyViewed } = useRecentlyViewed();
  const { addProduct: addToComparison, isInComparison, removeProduct: removeFromComparison } = useComparisonStore();
  const { data: product, isLoading, error } = useProduct(handle || '');
  const { data: variants = [] } = useProductVariants(product?.id);
  
  // Image carousel state
  const [activeImg, setActiveImg] = useState(0);

  // Open accordion section, so the rating near the title can open the reviews.
  const [openSection, setOpenSection] = useState<string>("");
  // ponytail: ProductReviews loads the same rows again; share them if it ever shows up as slow.
  const { averageRating, reviewCount } = useProductReviews(product?.id || '');

  // Variant selection state
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  
  // Get grouped variants
  const groupedVariants = useMemo(() => groupVariantsByType(variants), [variants]);
  
  // Set default variant selections when variants load
  useEffect(() => {
    if (variants.length > 0) {
      const defaults: Record<string, string> = {};
      Object.entries(groupedVariants).forEach(([type, typeVariants]) => {
        // Select first available variant
        const available = typeVariants.find(v => v.inventory_qty > 0);
        if (available) {
          defaults[type] = available.id;
        } else if (typeVariants[0]) {
          defaults[type] = typeVariants[0].id;
        }
      });
      setSelectedVariants(defaults);
    }
  }, [variants, groupedVariants]);
  
  // Calculate selected variant info
  const selectedVariantDetails = useMemo(() => {
    const selectedIds = Object.values(selectedVariants);
    const selected = variants.filter(v => selectedIds.includes(v.id));
    const totalPriceAdjustment = selected.reduce((sum, v) => sum + (v.price_adjustment_eur || 0), 0);
    const names = selected.map(v => v.option_value).join(', ');
    // For now, take the first variant as the main one
    const mainVariant = selected[0];
    return {
      variants: selected,
      priceAdjustment: totalPriceAdjustment,
      name: names,
      mainVariant,
    };
  }, [variants, selectedVariants]);

  // Log product view to product_views table for admin analytics
  useTrackProductView(product?.id);

  // Track ViewContent and add to recently viewed when product loads
  useEffect(() => {
    if (product) {
      const localizedTitle = getProductTitle(product, i18n.language);
      trackViewContentEvent({
        // Catalogue feeds key on SKU, so the pixel must report SKU too.
        id: product.sku || product.id,
        name: localizedTitle,
        price: product.price_eur * 100, // convert to cents
        currency: 'EUR',
        category: product.category,
      });
      // Add to recently viewed
      addToRecentlyViewed(product.id);
    }
  }, [product, addToRecentlyViewed, i18n.language]);

  const handleVariantChange = (type: string, variantId: string) => {
    setSelectedVariants(prev => ({ ...prev, [type]: variantId }));
  };

  const handleAddToCart = () => {
    if (product) {
      const variant = selectedVariantDetails.mainVariant 
        ? {
            id: selectedVariantDetails.mainVariant.id,
            name: selectedVariantDetails.name,
            priceAdjustment: selectedVariantDetails.priceAdjustment,
          }
        : undefined;
      
      addItem(product, 1, variant);
      const localizedTitle = getProductName(product, i18n.language);
      toast.success(t('products.addedToCart'), {
        description: variant ? `${localizedTitle} - ${variant.name}` : localizedTitle,
        position: "top-center",
      });
    }
  };

  const handleToggleComparison = () => {
    if (!product) return;
    const localizedTitle = getProductName(product, i18n.language);
    if (isInComparison(product.id)) {
      removeFromComparison(product.id);
      toast.info(t('products.removedFromComparison'), {
        description: localizedTitle,
        position: "top-center",
      });
    } else {
      const added = addToComparison(product);
      if (added) {
        toast.success(t('products.addedToComparison'), {
          description: localizedTitle,
          position: "top-center",
        });
      } else {
        toast.error(t('products.comparisonLimit'), {
          description: t('products.comparisonLimitDesc'),
          position: "top-center",
        });
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageLayout>
        <div className="container py-16">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show not found if product doesn't exist
  if (error || !product) {
    return (
      <PageLayout>
        <div className="container py-16">
          <div className="text-center">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">
              {t('products.constructorNotFound')}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t('products.constructorNotFoundDesc')}
            </p>
            <Button asChild>
              <Link to="/produktai/visi">{t('products.backToAll')}</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const isPreOrder = product.stock_status === 'preorder';
  const image = getProductImage(product);
  const images: string[] = product.images?.length ? product.images : [image];
  const details = (product.details_json ?? {}) as Record<string, unknown>;
  const ageMin = typeof details.ageMin === 'number' ? details.ageMin : null;
  const localizedTitle = getProductTitle(product, i18n.language);
  const displayTitle = getDisplayTitle(localizedTitle, product.sku);
  const detailsCount = (details.detailsCount as number) || (details.piecesCount as number) || displayTitle.pieces || 0;
  const deliveryWindow = getDeliveryWindow(product);
  const deliveryDates = formatDeliveryWindow(deliveryWindow, i18n.language);
  const christmasFit = getChristmasFit(deliveryWindow);
  const piecesLabel = detailsCount > 0
    ? t('products.piecesCountShort', { n: detailsCount.toLocaleString(i18n.language === 'en' ? 'en-GB' : 'lt-LT') })
    : null;
  const localizedShortDesc = getProductShortDesc(product, i18n.language);
  const localizedDescription = getProductDescription(product, i18n.language);
  
  // Check if sale price is active
  const hasSalePrice = product.sale_price_eur && product.sale_price_eur < product.price_eur;
  const displayPrice = hasSalePrice ? product.sale_price_eur! : product.price_eur;
  
  // Calculate final price with variant adjustments
  const finalPrice = displayPrice + selectedVariantDetails.priceAdjustment;

  // Only what we actually know about this set. Difficulty and build time used
  // to be the same fixed text on every product, flower bouquets included.
  const productSpecs = [
    piecesLabel && { label: t('products.partsCount'), value: piecesLabel },
    ageMin !== null && { label: t('products.ageGroup'), value: t('products.ageFrom', { age: ageMin }) },
    displayTitle.brand && { label: t('products.brand'), value: displayTitle.brand },
    { label: t('products.model'), value: product.sku },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <PageLayout>
      <SEOHead 
        title={localizedTitle}
        description={localizedShortDesc || localizedDescription || t(isPreOrder ? 'pgProductX.seoPreorder' : 'pgProductX.seoInStock', { title: localizedTitle })}
        canonical={`/produktas/${product.slug}`}
        type="product"
        image={image}
        product={{
          name: localizedTitle,
          price: displayPrice,
          currency: 'EUR',
          availability: isPreOrder ? 'PreOrder' : 'InStock',
          sku: product.sku,
          image: image,
          description: localizedShortDesc || localizedDescription,
        }}
        breadcrumbs={[
          { name: t('nav.home'), url: '/' },
          { name: t('nav.constructors'), url: '/produktai/visi' },
          { name: localizedTitle, url: `/produktas/${product.slug}` },
        ]}
      />
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <Link 
          to="/produktai/visi" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('products.backToConstructors')}
        </Link>

        {/* Product Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-secondary/30 to-muted/20 border border-border">
              <img
                src={images[activeImg]}
                alt={localizedTitle}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background transition-colors"
                    aria-label={t('pgProductX.prevPhoto')}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background transition-colors"
                    aria-label={t('pgProductX.nextPhoto')}
                  >
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                      i === activeImg ? "border-primary" : "border-border hover:border-primary/50"
                    )}
                  >
                    <img src={src} alt={`${localizedTitle} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Brand and model number above the name people actually search for */}
            <p className="text-sm text-muted-foreground mb-2">
              {[displayTitle.brand, product.sku].filter(Boolean).join(' · ')}
            </p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-3">
              {displayTitle.name}
            </h1>

            {/* Rating and the facts that decide a purchase, on one quiet line */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-5">
              {averageRating !== null && reviewCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setOpenSection('reviews');
                    document.getElementById('product-details')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1 text-foreground hover:underline underline-offset-4"
                >
                  <Star className="w-4 h-4 fill-current" aria-hidden="true" />
                  <span>{averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({t('products.reviewsCount', { count: reviewCount })})</span>
                </button>
              )}
              {piecesLabel && <span>{piecesLabel}</span>}
              {ageMin !== null && <span>{t('products.ageFrom', { age: ageMin })}</span>}
            </div>

            {/* Price: plain foreground; colour is kept for the one button that matters */}
            <div className="flex items-baseline gap-3 mb-6">
              {hasSalePrice ? (
                <>
                  <p className="font-heading text-3xl font-bold text-red-600">
                    {formatPrice(finalPrice)}
                  </p>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.price_eur + selectedVariantDetails.priceAdjustment)}
                  </span>
                </>
              ) : (
                <>
                  <p className="font-heading text-3xl font-bold">
                    {formatPrice(finalPrice)}
                  </p>
                  {selectedVariantDetails.priceAdjustment !== 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(displayPrice)}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Delivery as dates, not as weeks the shopper has to count */}
            <div className="rounded-xl border border-border p-4 mb-6 space-y-2">
              <div className="flex items-start gap-3">
                {isPreOrder
                  ? <Clock className="w-5 h-5 mt-0.5 text-muted-foreground" aria-hidden="true" />
                  : <Truck className="w-5 h-5 mt-0.5 text-muted-foreground" aria-hidden="true" />}
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isPreOrder ? t('products.preOrder') : t('products.inStock')} · {t('products.estDelivery')}
                  </p>
                  <p className="font-semibold">{deliveryDates}</p>
                </div>
              </div>
              {christmasFit && (
                <p className={cn(
                  "flex items-center gap-2 text-sm pl-8",
                  christmasFit === 'before' ? "text-success font-medium" : "text-muted-foreground"
                )}>
                  <Gift className="w-4 h-4" aria-hidden="true" />
                  {christmasFit === 'before' ? t('products.beforeChristmas') : t('products.afterChristmas')}
                </p>
              )}
              {isPreOrder && (
                <p className="text-sm text-muted-foreground pl-8">{t('products.cancelAnytime')}</p>
              )}
            </div>

            {/* Variant Selector */}
            {variants.length > 0 && (
              <VariantSelector
                variants={variants}
                selectedVariants={selectedVariants}
                onVariantChange={handleVariantChange}
                className="mb-6"
              />
            )}

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground h-14 text-base"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isPreOrder ? t('products.orderPreOrder') : t('products.addToCart')}
              </Button>

              {/* Comparison button */}
              <Button
                size="lg"
                variant={isInComparison(product.id) ? "secondary" : "outline"}
                className="h-14"
                onClick={handleToggleComparison}
                title={isInComparison(product.id) ? t('products.removeFromCompare') : t('products.addToCompare')}
                aria-label={isInComparison(product.id) ? t('products.removeFromCompare') : t('products.addToCompare')}
              >
                {isInComparison(product.id) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Scale className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* What happens after the click, answered before it */}
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Truck className="w-4 h-4 shrink-0" aria-hidden="true" />
                {t('products.freeShipping')}
              </li>
              <li className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <Link to="/grazinimai" className="hover:text-foreground hover:underline underline-offset-4">
                  {t('products.returnsPolicyLink')}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Puzzle className="w-4 h-4 shrink-0" aria-hidden="true" />
                {t('products.freeMissingParts')}
              </li>
              <li className="flex items-center gap-2">
                <Landmark className="w-4 h-4 shrink-0" aria-hidden="true" />
                {t('products.payByBank')}
              </li>
            </ul>

            {/* Short Description */}
            {localizedDescription && (
              <p className="text-muted-foreground mt-6 leading-relaxed">
                {localizedDescription}
              </p>
            )}
          </div>
        </div>

        {/* Below the fold content */}
        <div id="product-details" className="max-w-4xl scroll-mt-24">
          <PremiumAccordion type="single" collapsible value={openSection} onValueChange={setOpenSection} className="space-y-3">
            {/* Specs */}
            <PremiumAccordionItem value="specs">
              <PremiumAccordionTrigger icon={<Package className="w-4 h-4 text-primary" />}>
                {t('products.specifications')}
              </PremiumAccordionTrigger>
              <PremiumAccordionContent>
                <AccordionSpecTable specs={productSpecs} />
              </PremiumAccordionContent>
            </PremiumAccordionItem>

            {/* What's in the box */}
            <PremiumAccordionItem value="box">
              <PremiumAccordionTrigger icon={<Shield className="w-4 h-4 text-primary" />}>
                {t('products.boxContents')}
              </PremiumAccordionTrigger>
              <PremiumAccordionContent>
                <AccordionList>
                  <AccordionListItem>{t('products.boxContentsItems.allParts')}</AccordionListItem>
                  <AccordionListItem>{t('products.boxContentsItems.instructions')}</AccordionListItem>
                  <AccordionListItem>{t('products.boxContentsItems.spareParts')}</AccordionListItem>
                </AccordionList>
              </PremiumAccordionContent>
            </PremiumAccordionItem>

            {/* Missing parts */}
            <PremiumAccordionItem value="missing">
              <PremiumAccordionTrigger icon={<Puzzle className="w-4 h-4 text-primary" />}>
                {t('products.missingParts')}
              </PremiumAccordionTrigger>
              <PremiumAccordionContent>
                <p className="mb-4">
                  {t('products.missingPartsDesc')}
                </p>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>{t('products.missingPartsStep1')}</li>
                  <li>{t('products.missingPartsStep2')}</li>
                  <li>{t('products.missingPartsStep3')}</li>
                </ol>
                <p className="mt-4 pt-4 border-t border-border/40">
                  {t('misc.emailUs')}: <a href="mailto:support@ibrix.lt" className="text-primary hover:underline font-medium">support@ibrix.lt</a>
                </p>
              </PremiumAccordionContent>
            </PremiumAccordionItem>

            {/* FAQ */}
            <PremiumAccordionItem value="faq">
              <PremiumAccordionTrigger icon={<HelpCircle className="w-4 h-4 text-primary" />}>
                {t('misc.faqTitle')}
              </PremiumAccordionTrigger>
              <PremiumAccordionContent>
                <div className="space-y-4">
                  {productFAQKeys.map((item, idx) => (
                    <AccordionFaqItem key={idx} question={t(item.q)} answer={t(item.a)} />
                  ))}
                </div>
              </PremiumAccordionContent>
            </PremiumAccordionItem>

            {/* Reviews */}
            <PremiumAccordionItem value="reviews">
              <PremiumAccordionTrigger icon={<Star className="w-4 h-4 text-primary" />}>
                {t('nav.reviews')}
              </PremiumAccordionTrigger>
              <PremiumAccordionContent>
                <ProductReviews productId={product.id} productTitle={localizedTitle} />
              </PremiumAccordionContent>
            </PremiumAccordionItem>
          </PremiumAccordion>
        </div>

        {/* Related Products */}
        <RelatedProducts 
          currentProductId={product.id} 
          category={product.category}
          categoryId={product.category_id}
          tags={product.tags}
        />
      </div>
    </PageLayout>
  );
}
