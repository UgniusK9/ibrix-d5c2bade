import { Search, ShoppingCart, Package } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Išsirenkate modelį",
    description: "Peržiūrėkite mūsų premium variklio modelių kolekciją ir išsirinkite patikusį.",
  },
  {
    number: "02",
    icon: ShoppingCart,
    title: "Užsisakote",
    description: "Pre-order arba sandėlyje esančius modelius – viskas aiškiai pažymėta.",
  },
  {
    number: "03",
    icon: Package,
    title: "Surenkate",
    description: "Gausite detalų rinkinį su instrukcijomis ir turėsite unikalų display variklį.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Kaip tai veikia
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Paprastas procesas nuo pasirinkimo iki surinkimo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-card rounded-2xl p-6 md:p-8 shadow-premium hover:shadow-premium-lg transition-shadow"
            >
              {/* Number */}
              <span className="absolute top-6 right-6 font-heading text-5xl font-bold text-muted/50">
                {step.number}
              </span>

              {/* Icon */}
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <step.icon className="h-7 w-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="font-heading text-xl font-semibold mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
