import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Gift, Cog, Car, Puzzle, Zap } from "lucide-react";
import { motion } from "framer-motion";

const collections = [
  {
    id: "engines",
    title: "Varikliai",
    description: "Tikslūs mechaniniai modeliai",
    icon: Cog,
    href: "/produktai/varikliai",
    gradient: "from-primary/20 to-primary/5",
    accent: "bg-primary/10 text-primary",
  },
  {
    id: "cars",
    title: "Automobiliai",
    description: "Ikoniniai auto modeliai",
    icon: Car,
    href: "/produktai/automobiliai",
    gradient: "from-accent/20 to-accent/5",
    accent: "bg-accent/10 text-accent",
  },
  {
    id: "flowers",
    title: "Botanika",
    description: "Gėlių kolekcijos",
    icon: Sparkles,
    href: "/produktai/geles",
    gradient: "from-success/20 to-success/5",
    accent: "bg-success/10 text-success",
  },
  {
    id: "gifts",
    title: "Dovanos",
    description: "Idealios dovanoms",
    icon: Gift,
    href: "/produktai?tag=dovana",
    gradient: "from-destructive/15 to-destructive/5",
    accent: "bg-destructive/10 text-destructive",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function CollectionsSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/30">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-2 block">
            ATRASK
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Kolekcijos
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Pasirinkite kategoriją pagal savo interesus ir atraskite išskirtinius modelius.
          </p>
        </div>

        {/* Collections Grid */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {collections.map((collection) => {
            const Icon = collection.icon;
            return (
              <motion.div key={collection.id} variants={item}>
                <Link
                  to={collection.href}
                  className={`group relative block p-6 md:p-8 rounded-2xl bg-gradient-to-br ${collection.gradient} border border-border/50 hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300`}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${collection.accent} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="font-heading font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {collection.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {collection.description}
                  </p>
                  
                  {/* Arrow */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All Link */}
        <div className="text-center mt-10">
          <Link
            to="/produktai/visi"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Žiūrėti visas kategorijas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
