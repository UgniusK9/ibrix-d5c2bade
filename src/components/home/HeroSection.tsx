import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import wallpaper from "@/assets/wallpaper.png";
import logo from "@/assets/logo.png";

export function HeroSection() {
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
            <h1 className="font-heading text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] mb-6">
              <span className="text-accent">Mechaniniai</span> variklių{" "}
              <br className="hidden md:block" />
              modeliai, kurie juda.
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/75 mb-8 max-w-lg leading-relaxed">
              Ibrix – techninių konstruktorių kolekcija mechanikos fanams. 
              Išsirinkite modelį, užsisakykite (pre-order arba iš sandėlio) ir 
              surinkite savo „display" variklį.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
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
                  Kaip veikia Pre-Order
                </Link>
              </Button>
            </div>
          </div>

          {/* Right - Hero Product Card */}
          <div className="relative hidden lg:flex justify-center">
            {/* Floating labels */}
            <div className="absolute top-4 right-0 z-20">
              <div className="bg-card rounded-xl px-4 py-2 shadow-premium-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-sm font-medium">Mechanizmas</span>
                <span className="font-heading font-bold text-accent">Juda realiai</span>
              </div>
            </div>

            {/* Main product card */}
            <div className="relative">
              <div className="absolute inset-0 bg-accent/10 rounded-3xl blur-3xl transform translate-x-8 translate-y-8" />
              
              <div className="relative bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-primary-foreground/10 shadow-2xl">
                {/* Product image placeholder */}
                <div className="w-[400px] h-[350px] bg-gradient-to-br from-secondary/50 to-muted/30 flex items-center justify-center">
                  <div className="text-center text-muted-foreground/50 px-8">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <svg className="w-12 h-12 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Hero produktas</p>
                    <p className="text-xs mt-1">Pridėkite produktų</p>
                  </div>
                </div>
              </div>

              {/* Bottom chips */}
              <div className="absolute -bottom-4 left-4 z-20">
                <div className="bg-card rounded-xl px-4 py-2.5 shadow-premium-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="font-heading font-bold">2899</span>
                  <span className="text-muted-foreground text-sm">detalių</span>
                </div>
              </div>

              {/* Motorized badge */}
              <div className="absolute bottom-16 -right-4 z-20">
                <div className="bg-accent text-accent-foreground rounded-xl px-4 py-2 shadow-premium-lg flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-semibold">Motorized</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
