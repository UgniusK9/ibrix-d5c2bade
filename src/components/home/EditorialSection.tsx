import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function EditorialSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Main Editorial Block */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 md:p-12 min-h-[400px] flex flex-col justify-end"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[100px]" />
            <div className="absolute -bottom-20 -left-20 w-[200px] h-[200px] bg-primary-foreground/10 rounded-full blur-[60px]" />
            
            {/* Content */}
            <div className="relative z-10">
              <span className="inline-block text-xs font-semibold text-accent uppercase tracking-widest mb-4">
                NAUJIENA
              </span>
              <h3 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
                Mechaninių variklių kolekcija
              </h3>
              <p className="text-primary-foreground/80 mb-6 max-w-sm">
                Tikslūs, detalūs ir judantys. Kiekvienas modelis – tai inžinerijos šedevras ant jūsų stalo.
              </p>
              <Button 
                asChild 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Link to="/produktai/varikliai">
                  Peržiūrėti
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Secondary blocks */}
          <div className="grid gap-8">
            {/* Pre-order promo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary via-secondary to-muted p-8 border border-border"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                    KAIP TAI VEIKIA
                  </span>
                  <h4 className="font-heading text-xl font-bold mb-2">
                    Pre-order su depozitu
                  </h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    Užsakyk su mažu depoziou, sumokėk likutį kai prekė paruošta. Be rizikos.
                  </p>
                  <Link 
                    to="/pre-order" 
                    onClick={() => window.scrollTo(0, 0)}
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
                  >
                    Sužinoti daugiau
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Gift idea */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-8 border border-accent/20"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <span className="inline-block text-xs font-semibold text-accent uppercase tracking-widest mb-2">
                    DOVANŲ IDĖJA
                  </span>
                  <h4 className="font-heading text-xl font-bold mb-2">
                    Dovanų kuponai
                  </h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    Nežinai ką padovanoti? Leisk pasirinkti pačiam – dovanų kuponas bet kokiai sumai.
                  </p>
                  <Link 
                    to="/dovanu-kuponai" 
                    className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium text-sm"
                  >
                    Rinkti dovaną
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
