import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Clock, XCircle, Package, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Rezervuojate iš artimiausios partijos",
  "Terminas nurodytas produkto puslapyje",
  "Atšaukimas iki išsiuntimo – pilna suma",
  "Modelius vežam tik tada, kai realiai reikia",
];

const timeline = [
  { icon: Package, label: "Užsakymas", color: "bg-accent" },
  { icon: Ship, label: "Atvežimas", color: "bg-primary" },
  { icon: CheckCircle2, label: "Išsiuntimas", color: "bg-success" },
];

export function PreOrderSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
              Pre-order sistema
            </span>
            
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
              Saugus ir aiškus{" "}
              <span className="text-primary">pre-order</span>
            </h2>
            
            <p className="text-muted-foreground mb-8 text-lg">
              Pre-order leidžia užsisakyti produktą iš anksto, prieš jam atvykstant į sandėlį. 
              Tai reiškia mažesnes kainas ir garantuotą vietą limitinėse serijose.
            </p>

            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <Button asChild>
              <Link to="/pre-order">
                Sužinoti daugiau
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Right - Timeline Card */}
          <div className="relative">
            {/* Glow */}
            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-2xl transform translate-x-4 translate-y-4" />
            
            <div className="relative bg-card rounded-2xl p-8 shadow-premium-lg border border-border">
              <div className="flex items-center gap-3 mb-8">
                <Clock className="h-6 w-6 text-primary" />
                <span className="font-heading text-2xl font-bold">8–10 savaičių</span>
              </div>

              {/* Timeline */}
              <div className="relative">
                {/* Line */}
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />
                
                <div className="space-y-8">
                  {timeline.map((step, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${step.color} rounded-full flex items-center justify-center relative z-10`}>
                        <step.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancel info */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-start gap-3 text-sm">
                  <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Atšaukimas:</span> Galite atšaukti užsakymą 
                    bet kada iki išsiuntimo ir grąžiname pilną sumą.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
