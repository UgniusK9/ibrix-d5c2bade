import { Link } from "react-router-dom";
import { ArrowRight, Truck, RotateCcw, Shield, Wrench, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/data/mockProducts";

export function HeroSection() {
  // Use first mock product for hero card
  const featuredProduct = mockProducts[0];
  const secondProduct = mockProducts[1];

  return (
    <section className="relative min-h-[75vh] lg:min-h-[80vh] flex items-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* Base gradient - deeper with light center */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,50%,12%)] via-primary to-[hsl(220,45%,18%)]" />
        
        {/* Radial light center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.4)_0%,transparent_70%)]" />
        
        {/* Tech blueprint pattern - subtle lines */}
        <div 
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%23ffffff' stroke-width='0.5'%3E%3Cpath d='M0 30h60M30 0v60M0 0l60 60M60 0L0 60'/%3E%3Ccircle cx='30' cy='30' r='8'/%3E%3Ccircle cx='30' cy='30' r='15'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Noise/grain texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
        
        {/* Accent glow */}
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[180px]" />
      </div>

      <div className="container relative z-10 pt-8 lg:pt-0">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-primary-foreground">
            {/* Micro label */}
            <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-4 block">
              IBRIX · 2025 kolekcija
            </span>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-[1.1] mb-5">
              Judantys variklių modeliai, kurie atrodo įspūdingai ant stalo.
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/75 mb-6 max-w-lg leading-relaxed">
              Išsirinkite modelį iš sandėlio arba pre-order su aiškiu terminu. 
              Jei trūks detalės – išspręsime nemokamai.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
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

            {/* Trust row - enhanced */}
            <div className="grid grid-cols-2 gap-3 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-accent" />
                Nemokamas pristatymas LT į paštomatą
              </span>
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-accent" />
                14 d. grąžinimas
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                Saugūs mokėjimai
              </span>
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-accent" />
                Trūkstamos detalės – nemokamai
              </span>
            </div>
          </div>

          {/* Right - Hero Product Cards Stack */}
          <div className="relative hidden lg:flex justify-center items-center">
            {/* Second card (behind) */}
            <div className="absolute top-8 right-0 w-[340px] opacity-40 blur-[1px] transform translate-x-6 -translate-y-4 rotate-3">
              <div className="bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-primary-foreground/5 shadow-xl">
                <div className="w-full h-[240px] bg-gradient-to-br from-secondary/30 to-muted/20 overflow-hidden">
                  <img 
                    src={secondProduct.image} 
                    alt={secondProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-bold text-sm">{secondProduct.title}</h3>
                </div>
              </div>
            </div>

            {/* Main product card */}
            <div className="relative animate-float">
              {/* Floating badge */}
              <div className="absolute -top-3 right-4 z-20">
                <div className="bg-accent text-accent-foreground rounded-xl px-4 py-2 shadow-premium-lg text-sm font-semibold">
                  Populiariausias
                </div>
              </div>

              <div className="absolute inset-0 bg-accent/10 rounded-3xl blur-3xl transform translate-x-6 translate-y-6" />
              
              <Link 
                to={`/produktas/${featuredProduct.handle}`}
                className="relative block bg-gradient-to-br from-card/95 to-card/85 backdrop-blur-sm rounded-2xl overflow-hidden border border-primary-foreground/10 shadow-2xl hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Product image */}
                <div className="w-[360px] h-[280px] bg-gradient-to-br from-secondary/50 to-muted/30 overflow-hidden">
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

              {/* Bottom chip */}
              <div className="absolute -bottom-3 left-4 z-20">
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

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-primary-foreground/30 animate-bounce hidden lg:flex flex-col items-center gap-1">
        <span className="text-xs font-medium">Žemyn</span>
        <ChevronDown className="w-5 h-5" />
      </div>
    </section>
  );
}
