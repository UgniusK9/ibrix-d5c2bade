import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Package, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface BundleRule {
  id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  trigger_product_id: string | null;
  discount_product_id: string | null;
  active: boolean;
}

interface BundleWithProducts extends BundleRule {
  triggerProduct?: {
    id: string;
    title: string;
    price_eur: number;
    images: string[];
  };
  discountProduct?: {
    id: string;
    title: string;
    price_eur: number;
    images: string[];
  };
  originalTotal: number;
  bundlePrice: number;
  savingsAmount: number;
  itemCount: number;
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export function BundlesSection() {
  const [bundles, setBundles] = useState<BundleWithProducts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBundles = async () => {
      try {
        // Fetch active bundle rules
        const { data: rules, error } = await supabase
          .from('bundle_rules')
          .select('*')
          .eq('active', true)
          .limit(4);

        if (error) throw error;
        if (!rules || rules.length === 0) {
          setLoading(false);
          return;
        }

        // Get unique product IDs
        const productIds = new Set<string>();
        rules.forEach(rule => {
          if (rule.trigger_product_id) productIds.add(rule.trigger_product_id);
          if (rule.discount_product_id) productIds.add(rule.discount_product_id);
        });

        // Fetch products
        const { data: products } = await supabase
          .from('products')
          .select('id, title, price_eur, images')
          .in('id', Array.from(productIds));

        const productMap = new Map(products?.map(p => [p.id, p]) || []);

        // Build bundle display data
        const bundlesWithProducts: BundleWithProducts[] = rules
          .filter(rule => rule.trigger_product_id && rule.discount_product_id)
          .map(rule => {
            const triggerProduct = productMap.get(rule.trigger_product_id!);
            const discountProduct = productMap.get(rule.discount_product_id!);

            if (!triggerProduct || !discountProduct) return null;

            const originalTotal = triggerProduct.price_eur + discountProduct.price_eur;
            const discountAmount = rule.discount_type === 'percent' 
              ? (discountProduct.price_eur * rule.discount_value / 100)
              : rule.discount_value;
            const bundlePrice = originalTotal - discountAmount;

            return {
              ...rule,
              triggerProduct: {
                ...triggerProduct,
                images: Array.isArray(triggerProduct.images) ? triggerProduct.images : [],
              },
              discountProduct: {
                ...discountProduct,
                images: Array.isArray(discountProduct.images) ? discountProduct.images : [],
              },
              originalTotal,
              bundlePrice,
              savingsAmount: discountAmount,
              itemCount: 2,
            };
          })
          .filter(Boolean) as BundleWithProducts[];

        setBundles(bundlesWithProducts);
      } catch (e) {
        console.error('Failed to load bundles:', e);
      } finally {
        setLoading(false);
      }
    };

    loadBundles();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-secondary/50">
        <div className="container flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (bundles.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-secondary/50">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                Surink savo kolekciją
              </h2>
              <p className="text-muted-foreground">
                Specialios kainos rinkiniams
              </p>
            </div>
          </div>
        </div>

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle, index) => (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ 
                y: -4,
                transition: { type: "spring", stiffness: 300 }
              }}
              className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Images Row */}
              <div className="relative p-4 bg-muted">
                <div className="flex items-center justify-center gap-2">
                  {/* Trigger Product Image */}
                  <div className="w-24 h-24 rounded-xl bg-card border border-border overflow-hidden p-2">
                    <img 
                      src={bundle.triggerProduct?.images[0] || '/placeholder.svg'} 
                      alt={bundle.triggerProduct?.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Plus Sign */}
                  <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-lg">
                    +
                  </div>
                  
                  {/* Discount Product Image */}
                  <div className="w-24 h-24 rounded-xl bg-card border border-border overflow-hidden p-2">
                    <img 
                      src={bundle.discountProduct?.images[0] || '/placeholder.svg'} 
                      alt={bundle.discountProduct?.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Savings Badge */}
                <Badge className="absolute top-3 right-3 bg-red-500 text-white font-bold">
                  -{bundle.discount_type === 'percent' ? `${bundle.discount_value}%` : formatPrice(bundle.discount_value)}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-heading font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {bundle.name}
                </h3>
                
                {bundle.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {bundle.description}
                  </p>
                )}

                {/* Items count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Package className="w-4 h-4" />
                  <span>{bundle.itemCount} konstruktoriai rinkinyje</span>
                </div>

                {/* Pricing */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground line-through">
                      {formatPrice(bundle.originalTotal)}
                    </p>
                    <p className="font-heading font-bold text-xl text-red-500">
                      {formatPrice(bundle.bundlePrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Sutaupai</p>
                    <p className="font-bold text-green-600">
                      {formatPrice(bundle.savingsAmount)}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Button 
                  asChild 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                >
                  <Link to={`/produktas/${bundle.triggerProduct?.id}`}>
                    Peržiūrėti rinkinį
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
