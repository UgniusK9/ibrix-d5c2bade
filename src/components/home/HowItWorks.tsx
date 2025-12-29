import { Search, ShoppingCart, Wrench } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Pasirenkate modelį",
    description: "Peržiūrėkite kolekciją ir išsirinkite norimą variklio modelį.",
  },
  {
    number: "02",
    icon: ShoppingCart,
    title: "Užsisakote",
    description: "Pre-order arba iš sandėlio – aiškiai parodome statusą.",
  },
  {
    number: "03",
    icon: Wrench,
    title: "Surenkate",
    description: "Gavę rinkinį, surenkate ir turite display variklį.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-card border-y border-border">
      <div className="container">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-2 block">
            PROCESAS
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold">
            Kaip tai veikia
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connecting line - desktop only */}
          <div className="hidden md:block absolute top-[60px] left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-[2px]">
            <div className="w-full h-full border-t-2 border-dashed border-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center text-center">
                {/* Icon circle */}
                <div className="relative z-10 w-16 h-16 bg-background border-2 border-border rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <step.icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                </div>

                {/* Number */}
                <span className="text-accent font-heading font-bold text-sm mb-2">
                  {step.number}
                </span>

                {/* Content */}
                <h3 className="font-heading text-lg font-semibold mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
