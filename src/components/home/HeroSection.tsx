import { Link } from "react-router-dom";
import { ArrowRight, Truck, RotateCcw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/data/mockProducts";

export function HeroSection() {
  // Use first mock product for hero card
  const featuredProduct = mockProducts[0];

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(220,40%,15%)]" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 border border-primary-foreground/10 rounded-2xl transform -rotate-12 hidden lg:block" />
      <div className="absolute bottom-20 left-20 w-20 h-20 border border-primary-foreground/10 rounded-xl transform rotate-6 hidden lg:block" />
      
      {/* Radial glow */}
      <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[150px]" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="text-primary-foreground">
            {/* Micro label */}
            <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-4 block">
              IBRIX · 2025 kolekcija
            </span>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] mb-6">
              Judantys variklių modeliai, kurie atrodo įspūdingai ant stalo.
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/75 mb-8 max-w-lg leading-relaxed">
              Išsirinkite modelį iš sandėlio arba pre-order su aiškiu terminu. 
              Jei trūks detalės – išspręsime nemokamai.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                asChild 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12 px-6"
              >
                <Link to="/varikliai">
                  Peržiūrėti variklius
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent h-12 px-6"
              >
                <Link to="/pre-order" className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Kaip veikia pre-order
                </Link>
              </Button>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-primary-foreground/60">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                Nemokamas pristatymas LT į paštomatą
              </span>
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" />
                14 d. grąžinimas
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Saugūs mokėjimai
              </span>
            </div>
          </div>

          {/* Right - Hero Product Card */}
          <div className="relative hidden lg:flex justify-center">
            {/* Floating badge */}
            <div className="absolute top-0 right-8 z-20">
              <div className="bg-accent text-accent-foreground rounded-xl px-4 py-2 shadow-premium-lg text-sm font-semibold">
                Populiariausias
              </div>
            </div>

            {/* Main product card */}
            <div className="relative animate-float">
              <div className="absolute inset-0 bg-accent/10 rounded-3xl blur-3xl transform translate-x-8 translate-y-8" />
              
              <Link 
                to={`/produktas/${featuredProduct.handle}`}
                className="relative block bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-primary-foreground/10 shadow-2xl hover:shadow-premium-lg transition-shadow"
              >
                {/* Product image */}
                <div className="w-[380px] h-[320px] bg-gradient-to-br from-secondary/50 to-muted/30 overflow-hidden">
                  <img 
                    src={featuredProduct.image} 
                    alt={featuredProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product info */}
                <div className="p-5">
                  <h3 className="font-heading font-bold text-lg mb-2">{featuredProduct.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {featuredProduct.detailsCount} detalių · 16+ · ~20–30 val.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-lg">
                      Pre-order · pristatymas per {featuredProduct.eta}
                    </span>
                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      Žiūrėti modelį
                    </Button>
                  </div>
                </div>
              </Link>

              {/* Bottom chips */}
              <div className="absolute -bottom-4 left-4 z-20">
                <div className="bg-card rounded-xl px-4 py-2.5 shadow-premium-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="font-heading font-bold">{featuredProduct.detailsCount}</span>
                  <span className="text-muted-foreground text-sm">detalių</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
