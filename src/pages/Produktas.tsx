import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Package, Clock, Truck, RotateCcw, Shield, ShoppingCart, Puzzle, HelpCircle, Loader2, Star, Scale, Check } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProduct, formatPrice, getEtaString, getProductImage } from "@/hooks/useProducts";
import { useProductVariants, groupVariantsByType, type ProductVariant } from "@/hooks/useProductVariants";
import { VariantSelector } from "@/components/products/VariantSelector";
import { useCartStore } from "@/stores/cartStore";
import { useComparisonStore } from "@/stores/comparisonStore";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { toast } from "sonner";
import { trackViewContentEvent } from "@/hooks/useAnalytics";
import { SEOHead } from "@/components/seo/SEOHead";
import { ProductReviews } from "@/components/products/ProductReviews";
import { RelatedProducts } from "@/components/home/RelatedProducts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const trustItems = [
  { icon: Truck, text: "Nemokamas pristatymas" },
  { icon: RotateCcw, text: "14 d. grąžinimas" },
  { icon: Puzzle, text: "Trūkstamos detalės – nemokamai" },
];

const boxContents = [
  "Visos konstrukcinės detalės (pilnas komplektas)",
  "Iliustruota surinkimo instrukcija (EN)",
  "Atsarginės smulkios detalės",
  "Stovas ekspozicijai",
];

const productFAQ = [
  {
    question: "Ar visos detalės bus rinkinyje?",
    answer: "Taip, visi rinkiniai patikrinami prieš išsiuntimą. Jei vis dėlto trūktų detalės – susisiekite su mumis ir išspręsime per 5 darbo dienas, nemokamai.",
  },
  {
    question: "Ar reikia specialių įrankių?",
    answer: "Ne, visi reikalingi įrankiai įtraukti į rinkinį. Papildomai galite naudoti smulkų pincetą, bet tai nebūtina.",
  },
  {
    question: "Ar modelis tikrai juda?",
    answer: "Taip, visų variklio modelių mechanizmai yra veikiantys. Stūmokliai, alkūninis velenas ir kitos dalys juda sinchroniškai, imituojant tikrą variklio darbą.",
  },
];

export default function Produktas() {
  const { handle } = useParams<{ handle: string }>();
  const addItem = useCartStore((state) => state.addItem);
  const { addProduct: addToRecentlyViewed } = useRecentlyViewed();
  const { addProduct: addToComparison, isInComparison, removeProduct: removeFromComparison } = useComparisonStore();
  const { data: product, isLoading, error } = useProduct(handle || '');
  const { data: variants = [] } = useProductVariants(product?.id);
  
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

  // Track ViewContent and add to recently viewed when product loads
  useEffect(() => {
    if (product) {
      trackViewContentEvent({
        id: product.id,
        name: product.title,
        price: product.price_eur * 100, // convert to cents
        currency: 'EUR',
        category: product.category,
      });
      // Add to recently viewed
      addToRecentlyViewed(product.id);
    }
  }, [product, addToRecentlyViewed]);

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
      toast.success("Pridėta į krepšelį", {
        description: variant ? `${product.title} - ${variant.name}` : product.title,
        position: "top-center",
      });
    }
  };

  const handleToggleComparison = () => {
    if (!product) return;
    
    if (isInComparison(product.id)) {
      removeFromComparison(product.id);
      toast.info("Pašalinta iš palyginimo", {
        description: product.title,
        position: "top-center",
      });
    } else {
      const added = addToComparison(product);
      if (added) {
        toast.success("Pridėta palyginimui", {
          description: product.title,
          position: "top-center",
        });
      } else {
        toast.error("Palyginimo limitas", {
          description: "Galite palyginti iki 3 produktų",
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
              Produktas nerastas
            </h1>
            <p className="text-muted-foreground mb-6">
              Šio konstruktoriaus nepavyko rasti. Galite peržiūrėti kitus konstruktorius.
            </p>
            <Button asChild>
              <Link to="/produktai/visi">Grįžti į kolekciją</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const isPreOrder = product.stock_status === 'preorder';
  const eta = getEtaString(product);
  const image = getProductImage(product);
  const detailsCount = (product.details_json as Record<string, unknown>)?.detailsCount as number || 0;
  const badges = (product as any).badges as string[] || [];
  
  // Check if sale price is active
  const hasSalePrice = product.sale_price_eur && product.sale_price_eur < product.price_eur;
  const displayPrice = hasSalePrice ? product.sale_price_eur! : product.price_eur;
  
  // Calculate final price with variant adjustments
  const finalPrice = displayPrice + selectedVariantDetails.priceAdjustment;

  const productSpecs = [
    { label: "Detalių skaičius", value: detailsCount > 0 ? `${detailsCount} vnt.` : "—" },
    { label: "Sudėtingumas", value: "Pažengusiems" },
    { label: "Amžiaus grupė", value: "16+" },
    { label: "Surinkimo laikas", value: "~20–30 val." },
  ];

  return (
    <PageLayout>
      <SEOHead 
        title={product.title}
        description={product.short_desc || product.description || `${product.title} - aukštos kokybės modelis iš IBRIX. ${isPreOrder ? 'Pre-order su depozitu.' : 'Sandėlyje.'}`}
        canonical={`/produktas/${product.slug}`}
        type="product"
        image={image}
        product={{
          name: product.title,
          price: displayPrice,
          currency: 'EUR',
          availability: isPreOrder ? 'PreOrder' : 'InStock',
          sku: product.sku,
          image: image,
          description: product.short_desc || product.description,
        }}
        breadcrumbs={[
          { name: 'Pradžia', url: '/' },
          { name: 'Produktai', url: '/produktai/visi' },
          { name: product.title, url: `/produktas/${product.slug}` },
        ]}
      />
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <Link 
          to="/produktai/visi" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Grįžti į konstruktorius
        </Link>

        {/* Product Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-secondary/30 to-muted/20 border border-border">
              <img
                src={image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div>
            {/* SKU */}
            <p className="text-sm text-muted-foreground font-mono mb-2">{product.sku}</p>
            
            {/* Title */}
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-4">
              {hasSalePrice ? (
                <>
                  <p className="font-heading text-3xl font-bold text-red-500">
                    {formatPrice(finalPrice)}
                  </p>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.price_eur + selectedVariantDetails.priceAdjustment)}
                  </span>
                  <Badge className="bg-red-500 text-white font-bold">Akcija</Badge>
                </>
              ) : (
                <>
                  <p className="font-heading text-3xl font-bold text-accent">
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

            {/* Status Badge */}
            <div className="flex items-center gap-3 mb-6">
              <Badge className={`text-sm px-3 py-1 ${isPreOrder ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"}`}>
                {isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
              </Badge>
              {detailsCount > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Package className="w-4 h-4" />
                  {detailsCount} detalių
                </span>
              )}
            </div>

            {/* ETA Block */}
            {isPreOrder && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-heading font-semibold">
                    Pre-order: {eta}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Atšaukti galima bet kada iki išsiuntimo – grąžiname pilną sumą
                </p>
              </div>
            )}

            {/* Trust Row */}
            <div className="flex flex-wrap gap-4 mb-6">
              {trustItems.map((item, idx) => (
                <span key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  {item.text}
                </span>
              ))}
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
                {isPreOrder ? "Užsisakyti (pre-order)" : "Į krepšelį"}
              </Button>
              
              {/* Comparison button */}
              <Button 
                size="lg" 
                variant={isInComparison(product.id) ? "secondary" : "outline"}
                className="h-14"
                onClick={handleToggleComparison}
                title={isInComparison(product.id) ? "Pašalinti iš palyginimo" : "Pridėti palyginimui"}
              >
                {isInComparison(product.id) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Scale className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            {/* CTA subtext */}
            {isPreOrder && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                Atšaukti galima iki išsiuntimo. Grąžiname pilną sumą.
              </p>
            )}

            {/* Short Description */}
            {product.description && (
              <p className="text-muted-foreground mt-6 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* Below the fold content */}
        <div className="max-w-4xl">
          <Accordion type="single" collapsible className="space-y-4">
            {/* Specs */}
            <AccordionItem value="specs" className="border border-border rounded-xl px-6 data-[state=open]:bg-card">
              <AccordionTrigger className="hover:no-underline py-5">
                <span className="flex items-center gap-3 font-heading font-semibold">
                  <Package className="w-5 h-5 text-primary" />
                  Specifikacijos
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <dl className="grid grid-cols-2 gap-4">
                  {productSpecs.map((spec) => (
                    <div key={spec.label}>
                      <dt className="text-sm text-muted-foreground">{spec.label}</dt>
                      <dd className="font-medium">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </AccordionContent>
            </AccordionItem>

            {/* What's in the box */}
            <AccordionItem value="box" className="border border-border rounded-xl px-6 data-[state=open]:bg-card">
              <AccordionTrigger className="hover:no-underline py-5">
                <span className="flex items-center gap-3 font-heading font-semibold">
                  <Shield className="w-5 h-5 text-primary" />
                  Kas dėžėje
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <ul className="space-y-2">
                  {boxContents.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Missing parts */}
            <AccordionItem value="missing" className="border border-border rounded-xl px-6 data-[state=open]:bg-card">
              <AccordionTrigger className="hover:no-underline py-5">
                <span className="flex items-center gap-3 font-heading font-semibold">
                  <Puzzle className="w-5 h-5 text-primary" />
                  Trūkstamos detalės
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <p className="text-muted-foreground mb-4">
                  Rinkinius patikriname prieš išsiuntimą. Jei vis dėlto trūktų detalės, išspręsime nemokamai:
                </p>
                <ol className="space-y-2 text-muted-foreground">
                  <li>1. Parašykite per kontaktų formą arba el. paštu</li>
                  <li>2. Nurodykite modelio pavadinimą ir detalės numerį</li>
                  <li>3. Trūkstamą detalę išsiunčiame per 5 darbo dienas</li>
                </ol>
                <p className="text-sm text-muted-foreground mt-4">
                  Rašykite: <a href="mailto:support@ibrix.lt" className="text-primary hover:underline">support@ibrix.lt</a>
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* FAQ */}
            <AccordionItem value="faq" className="border border-border rounded-xl px-6 data-[state=open]:bg-card">
              <AccordionTrigger className="hover:no-underline py-5">
                <span className="flex items-center gap-3 font-heading font-semibold">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Dažnai užduodami klausimai
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-4">
                  {productFAQ.map((item, idx) => (
                    <div key={idx}>
                      <h4 className="font-medium mb-1">{item.question}</h4>
                      <p className="text-sm text-muted-foreground">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            {/* Reviews */}
            <AccordionItem value="reviews" className="border border-border rounded-xl px-6 data-[state=open]:bg-card">
              <AccordionTrigger className="hover:no-underline py-5">
                <span className="flex items-center gap-3 font-heading font-semibold">
                  <Star className="w-5 h-5 text-primary" />
                  Atsiliepimai
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <ProductReviews productId={product.id} productTitle={product.title} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
