import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Kiek laiko užtrunka surinkti?",
    answer: "Priklauso nuo modelio. Prie kiekvieno produkto nurodomas orientacinis surinkimo laikas (pvz., 8-10 val. arba 20-30 val.).",
  },
  {
    question: "Ar modelis tikrai juda?",
    answer: "Taip. Mechanizmas veikia - juda stūmokliai, alkūninis velenas ir kitos dalys. Tai ne dekoracija - tai judantis modelis.",
  },
  {
    question: "Ar reikia specialių įrankių?",
    answer: "Ne. Pagrindiniai įrankiai dažniausiai įtraukti. Jei norisi - galima naudoti pincetą, bet tai nebūtina.",
  },
  {
    question: "Kuo skiriasi Sandėlyje ir Pre-order?",
    answer: "Sandėlyje - išsiunčiam per 1-2 d. Pre-order - rezervuojate artimiausią partiją su aiškiu terminu, kuris nurodytas prie produkto.",
  },
  {
    question: "Ar galima atšaukti pre-order?",
    answer: "Taip. Iki išsiuntimo galite atšaukti ir atgausite pilną sumą.",
  },
  {
    question: "Kas jei trūksta detalės?",
    answer: "Parašote mums, nurodote modelį ir detalės numerį. Trūkstamą detalę atsiunčiame nemokamai per 5 darbo dienas.",
  },
  {
    question: "Ar tinka dovanai?",
    answer: "Taip. Tai premium tipo dovana mechanikos fanui. Rinkinys atrodo gerai net dėžėje, o surinktas modelis tinka ekspozicijai.",
  },
  {
    question: "Kokiam amžiui tinka?",
    answer: "Prie kiekvieno produkto nurodoma amžiaus rekomendacija (pvz., 14+ arba 16+). Sudėtingesniems modeliams rekomenduojame kantrybę ir laiką.",
  },
  {
    question: "Kaip veikia grąžinimas?",
    answer: "Galite grąžinti per 14 dienų. Svarbu, kad prekė būtų nenaudota ir originalioje pakuotėje (detalės nesumaišytos).",
  },
  {
    question: "Ar mokėjimai saugūs?",
    answer: "Taip. Naudojame saugius mokėjimų būdus - kortelė, bankas.",
  },
];

export function FAQSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-2 block">
              D.U.K
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Dažnai užduodami klausimai
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl px-6 border border-border data-[state=open]:border-primary/20 data-[state=open]:shadow-premium transition-all"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5 text-[15px]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
