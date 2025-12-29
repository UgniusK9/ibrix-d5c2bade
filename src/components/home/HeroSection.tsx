import { Link } from "react-router-dom";
import { ArrowRight, Truck, Shield, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import wallpaper from "@/assets/wallpaper.png";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={wallpaper} 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-hero" />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
      </div>

      {/* Radial spotlight */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-primary-foreground animate-fade-in-up">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Variklių modeliai,{" "}
              <span className="text-accent">kurie juda.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-lg">
              Techniniai konstruktoriai mechanikos fanams. Pre-order aiškus, 
              siuntimas nemokamas į paštomatą Lietuvoje.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                asChild 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
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
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
              >
                <Link to="/pre-order">
                  Kaip veikia Pre-order
                </Link>
              </Button>
            </div>

            {/* Mini trust row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                8–10 sav. pristatymas (pre-order)
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                Atšaukti galima bet kada
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                Pagalba LT
              </span>
            </div>
          </div>

          {/* Right - Hero Product Card (placeholder for when products exist) */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-2xl transform translate-x-4 translate-y-4" />
              
              <div className="relative bg-card/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/10 animate-float">
                <div className="aspect-square bg-primary-foreground/5 rounded-xl flex items-center justify-center mb-4">
                  <div className="text-center text-primary-foreground/50">
                    <p className="text-lg font-heading">Hero produktas</p>
                    <p className="text-sm">Pridėkite produktų, kad jie būtų rodomi čia</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-primary-foreground/10 rounded-full text-xs text-primary-foreground">
                    2899 det.
                  </span>
                  <span className="px-3 py-1 bg-accent/20 rounded-full text-xs text-accent">
                    Juda realiai
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
