import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Package, Clock, Truck, RotateCcw, Shield, ShoppingCart, Puzzle, HelpCircle } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockProducts, getMockProduct, formatMockPrice } from "@/data/mockProducts";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { trackViewContentEvent } from "@/hooks/useAnalytics";
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

const productSpecs = [
  { label: "Detalių skaičius", value: "2899 vnt." },
  { label: "Sudėtingumas", value: "Pažengusiems" },
  { label: "Amžiaus grupė", value: "16+" },
  { label: "Surinkimo laikas", value: "~20–30 val." },
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

  // Get product from mock data
  const product = handle ? getMockProduct(handle) : undefined;

  // Track ViewContent when product loads
  useEffect(() => {
    if (product) {
      trackViewContentEvent({
        id: product.id,
        name: product.title,
        price: product.price * 100, // convert to cents
        currency: product.currency,
        category: 'engines',
      });
    }
  }, [product]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product);
      toast.success("Pridėta į krepšelį", {
        description: product.title,
        position: "top-center",
      });
    }
  };

  // Show not found if product doesn't exist
  if (!product) {
    return (
      <PageLayout>
        <div className="container py-16">
          <div className="text-center">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="font-heading text-2xl font-bold mb-2">
              Produktas nerastas
            </h1>
            <p className="text-muted-foreground mb-6">
              Šio produkto nepavyko rasti. Galite peržiūrėti kitus variklius.
            </p>
            <Button asChild>
              <Link to="/varikliai">Grįžti į kolekciją</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const isPreOrder = product.status === "pre-order";
  const eta = product.eta;

  return (
    <PageLayout>
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <Link 
          to="/varikliai" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Grįžti į variklius
        </Link>

        {/* Product Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-secondary/30 to-muted/20 border border-border">
              <img
                src={product.image}
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
            <p className="font-heading text-3xl font-bold text-accent mb-4">
              {formatMockPrice(product.price, product.currency)}
            </p>

            {/* Status Badge */}
            <div className="flex items-center gap-3 mb-6">
              <Badge className={`text-sm px-3 py-1 ${isPreOrder ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"}`}>
                {isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
              </Badge>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Package className="w-4 h-4" />
                {product.detailsCount} detalių
              </span>
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
            <div className="flex flex-wrap gap-4 mb-8">
              {trustItems.map((item, idx) => (
                <span key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  {item.text}
                </span>
              ))}
            </div>

            {/* CTA */}
            <Button 
              size="lg" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-14 text-base"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {isPreOrder ? "Užsisakyti (pre-order)" : "Į krepšelį"}
            </Button>
            
            {/* CTA subtext */}
            {isPreOrder && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                Atšaukti galima iki išsiuntimo. Grąžiname pilną sumą.
              </p>
            )}

            {/* Short Description */}
            <p className="text-muted-foreground mt-6 leading-relaxed">
              {product.description}
            </p>
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
          </Accordion>
        </div>
      </div>
    </PageLayout>
  );
}
