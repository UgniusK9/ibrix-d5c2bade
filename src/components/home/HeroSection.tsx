import { Link } from "react-router-dom";
import { ArrowRight, Truck, RotateCcw, Shield, Wrench, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts, getProductImage, getEtaString, formatPrice } from "@/hooks/useProducts";
import { motion } from "framer-motion";

export function HeroSection() {
  const { data: products, isLoading } = useProducts();
  
  // Use first product for hero
  const featuredProduct = products?.[0];

  return (
    <section className="relative min-h-[80vh] lg:min-h-[85vh] flex items-center overflow-hidden gradient-hero">
      {/* Blueprint grid + soft vignette (like previous version) */}
      <div className="absolute inset-0 pattern-hero-grid opacity-[0.12]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[hsl(220_40%_10%/0.45)]" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div 
            className="text-primary-foreground"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge className="bg-accent/20 text-accent border-accent/30 font-semibold px-3 py-1">
                Naujiena
              </Badge>
              <Badge className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 font-medium px-3 py-1">
                2025 Kolekcija
              </Badge>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
              Mechaniniai konstruktoriai, <span className="text-accent">kurie juda.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/70 mb-8 max-w-lg leading-relaxed">
              Atrask išskirtinius variklių modelius ir automobilių konstruktorius. 
              Aiškus pre-order terminas, nemokamas pristatymas ir pagalba lietuviškai.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button 
                asChild 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-14 px-8 text-base"
              >
                <Link to="/produktai/visi">
                  Peržiūrėti konstruktorius
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent h-14 px-8 text-base"
              >
                <Link to="/pre-order">
                  Kaip veikia pre-order
                </Link>
              </Button>
            </div>

            {/* Trust row */}
            <div className="grid grid-cols-2 gap-4 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-accent" />
                </div>
                Nemokamas pristatymas LT
              </span>
              <span className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-accent" />
                </div>
                14 d. grąžinimas
              </span>
              <span className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-accent" />
                </div>
                Saugūs mokėjimai
              </span>
              <span className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-accent" />
                </div>
                Trūkstamos detalės – nemokamai
              </span>
            </div>
          </motion.div>

          {/* Right - Hero Product */}
          <motion.div 
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="w-10 h-10 animate-spin text-accent" />
              </div>
            ) : featuredProduct ? (
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 bg-accent/20 rounded-3xl blur-[60px] transform translate-x-8 translate-y-8" />
                
                {/* Main card */}
                <Link 
                  to={`/produktas/${featuredProduct.slug}`}
                  className="relative block bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-primary-foreground/10 shadow-2xl hover:shadow-premium-lg transition-all duration-500 hover:-translate-y-2 group"
                >
                  {/* Badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <Badge className={`${featuredProduct.stock_status === 'preorder' ? 'bg-primary text-primary-foreground' : 'bg-success text-success-foreground'} font-semibold px-3 py-1`}>
                      {featuredProduct.stock_status === 'preorder' ? 'PRE-ORDER' : 'SANDĖLYJE'}
                    </Badge>
                  </div>
                  
                  {/* Popular badge */}
                  <div className="absolute top-4 right-4 z-20">
                    <Badge className="bg-accent text-accent-foreground font-semibold px-3 py-1">
                      Populiariausias
                    </Badge>
                  </div>

                  {/* Image */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-secondary/50 to-muted/30 overflow-hidden">
                    <img 
                      src={getProductImage(featuredProduct)} 
                      alt={featuredProduct.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <p className="text-xs text-muted-foreground font-mono mb-2">{featuredProduct.sku}</p>
                    <h3 className="font-heading font-bold text-xl mb-3 group-hover:text-primary transition-colors">
                      {featuredProduct.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-heading font-bold text-accent">
                          {formatPrice(featuredProduct.price_eur)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getEtaString(featuredProduct)}
                        </p>
                      </div>
                      <Button className="bg-primary hover:bg-primary/90">
                        Žiūrėti
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary-foreground/40 animate-bounce hidden lg:flex flex-col items-center gap-1">
        <span className="text-xs font-medium uppercase tracking-wider">Žemyn</span>
        <ChevronDown className="w-5 h-5" />
      </div>
    </section>
  );
}