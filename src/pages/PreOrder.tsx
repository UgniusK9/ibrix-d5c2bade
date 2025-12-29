import { Link } from "react-router-dom";
import { ArrowRight, Clock, Package, Truck, RotateCcw, Headphones, CheckCircle2, ShieldCheck } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    title: "Užsisakote",
    description: "Išsirenkate norimą variklį ir pateikiate užsakymą. Apmokėjimas atliekamas iš karto – tai rezervuoja jūsų vietą partijoje.",
    icon: ShoppingCart,
  },
  {
    number: "02",
    title: "Partija ruošiama",
    description: "Jūsų produktas gamykloje surenkamas ir siunčiamas į Lietuvą. Paprastai tai trunka 8–10 savaičių.",
    icon: Package,
  },
  {
    number: "03",
    title: "Išsiunčiame jums",
    description: "Kai tik produktas pasiekia mūsų sandėlį, per 1–2 darbo dienas išsiunčiame į pasirinktą paštomatą – nemokamai.",
    icon: Truck,
  },
];

function ShoppingCart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

const bulletPoints = [
  {
    icon: Clock,
    title: "Terminas visada aiškiai nurodytas",
    description: "Kiekvieno produkto puslapyje matote tikslų pristatymo terminą.",
  },
  {
    icon: RotateCcw,
    title: "Atšaukti galima bet kada iki išsiuntimo",
    description: "Persigalvojote? Grąžiname pilną sumą be jokių klausimų.",
  },
  {
    icon: Truck,
    title: "Nemokamas siuntimas į paštomatą",
    description: "Siuntimas į bet kurį Omniva, LP Express ar DPD paštomatą Lietuvoje nemokamas.",
  },
  {
    icon: Headphones,
    title: "Pagalba lietuviškai + trūkstamų detalių sprendimas",
    description: "Mūsų komanda padeda lietuviškai. Jei trūksta detalių – sprendžiame nemokamai.",
  },
];

export default function PreOrder() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              <Clock className="w-4 h-4" />
              Pre-order sistema
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
              Kaip veikia pre-order?
            </h1>
            <p className="text-lg text-muted-foreground">
              Pre-order leidžia užsisakyti produktą, kurio šiuo metu nėra sandėlyje. 
              Tai paprasta, saugu ir visiškai skaidru – štai kaip tai veikia.
            </p>
          </div>

          {/* Timeline Steps */}
          <div className="relative max-w-4xl mx-auto">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-border" />
            
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={step.number} className="relative">
                  <div className="bg-card border border-border rounded-2xl p-6 h-full">
                    {/* Number badge */}
                    <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-heading font-bold text-lg mb-4">
                      {step.number}
                    </div>
                    
                    <h3 className="font-heading text-xl font-semibold mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Arrow for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-24 -right-4 transform -translate-y-1/2 z-10">
                      <div className="w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ETA Card */}
      <section className="py-12 bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-accent" />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-2">
                8–10 savaičių
              </h2>
              <p className="text-muted-foreground mb-4">
                Standartinis pre-order pristatymo laikas nuo užsakymo pateikimo
              </p>
              <p className="text-sm text-muted-foreground">
                Kodėl tiek? Produktai siunčiami DDP (pristatymas iki durų) iš gamyklos, 
                įskaitant visus muitus ir mokesčius. Tai užtikrina, kad jūs gaunate produktą 
                be papildomų išlaidų.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bullet Points */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-4">
            Svarbiausia žinoti
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Mūsų pre-order sistema sukurta taip, kad būtų kuo paprastesnė ir saugesnė
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {bulletPoints.map((point, index) => (
              <div key={index} className="flex gap-4 p-6 bg-card border border-border rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <point.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold mb-1">{point.title}</h3>
                  <p className="text-sm text-muted-foreground">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cancellation Policy */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-accent" />
            <h2 className="font-heading text-2xl font-bold mb-4">
              Atšaukimo politika
            </h2>
            <p className="text-primary-foreground/80 mb-6">
              Persigalvojote arba aplinkybės pasikeitė? Jokių problemų. 
              Galite atšaukti savo pre-order užsakymą bet kada iki produkto išsiuntimo 
              iš mūsų sandėlio. Grąžiname <strong>100% sumos</strong> per 5–7 darbo dienas.
            </p>
            <div className="flex items-center justify-center gap-2 text-accent">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Be jokių papildomų mokesčių ar klausimų</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
              Pasiruošę užsisakyti?
            </h2>
            <p className="text-muted-foreground mb-8">
              Peržiūrėkite mūsų variklio modelių kolekciją ir išsirinkite savo mėgstamą
            </p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to="/varikliai">
                Peržiūrėti variklius
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
