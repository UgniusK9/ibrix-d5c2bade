import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Rezervuojate rinkinį iš artimiausios partijos",
  "Terminas visada aiškiai nurodytas (pvz., 8–10 savaičių)",
  "Galite atšaukti bet kada iki išsiuntimo ir atgausite pilną sumą",
  "Rūšiuojame modelius Lietuvoje – tik tada, kai realiai reikia",
];

export function PreOrderSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(220,40%,12%)]" />
      
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-64 h-64 border border-primary-foreground/5 rounded-full hidden lg:block" />
      <div className="absolute bottom-10 left-10 w-40 h-40 border border-primary-foreground/5 rounded-full hidden lg:block" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-primary-foreground">
            <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-3 block">
              PRE-ORDER
            </span>
            
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6 leading-tight">
              Sąžiningas ir aiškus pre-order modelis
            </h2>
            
            <p className="text-primary-foreground/75 mb-8 text-lg leading-relaxed">
              Pre-order reiškia, kad rezervuojate rinkinį iš artimiausios atvežimo partijos. 
              Taip galime pasiūlyti modelius, kurių Lietuvoje kitaip nebūtų.
            </p>

            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-primary-foreground/90">{benefit}</span>
                </li>
              ))}
            </ul>

            <Button 
              asChild 
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-11 px-6"
            >
              <Link to="/pre-order">
                Sužinoti daugiau
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Right - Timeline Card */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Card glow */}
              <div className="absolute inset-0 bg-accent/20 rounded-3xl blur-2xl transform translate-x-4 translate-y-4" />
              
              <div className="relative bg-gradient-to-br from-card to-card/95 rounded-2xl p-8 md:p-10 shadow-2xl max-w-sm">
                {/* Main number */}
                <div className="text-center mb-6">
                  <span className="font-heading text-6xl md:text-7xl font-bold text-accent">
                    8-10
                  </span>
                  <p className="text-xl font-medium text-foreground mt-1">savaičių</p>
                  <p className="text-sm text-muted-foreground mt-1">tipinis pristatymo laikas</p>
                </div>

                {/* Timeline visual */}
                <div className="relative pt-6 border-t border-border">
                  <div className="flex justify-between">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <div className="w-0.5 h-8 bg-border mt-1" />
                      <span className="text-xs text-muted-foreground mt-1">Užsakymas</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <div className="w-0.5 h-8 bg-border mt-1" />
                      <span className="text-xs text-muted-foreground mt-1">Atvežimas</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <div className="w-0.5 h-8 bg-border mt-1" />
                      <span className="text-xs text-muted-foreground mt-1">Išsiuntimas</span>
                    </div>
                  </div>
                  {/* Connecting line */}
                  <div className="absolute top-[30px] left-[6px] right-[6px] h-0.5 bg-border -z-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
