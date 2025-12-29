import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Kiek laiko užtrunka surinkti?",
    answer: "Priklausomai nuo modelio sudėtingumo, surinkimas užtrunka nuo 4 iki 12 valandų. Sudėtingesni modeliai kaip V8 gali užtrukti ilgiau, bet instrukcijos aiškios ir procesas malonus.",
  },
  {
    question: "Ar tai suderinama su kitomis kaladėlėmis?",
    answer: "Taip, mūsų modeliai naudoja standartines kaladėles, kurios suderinamos su populiariais techniniais konstruktoriais. Galite kombinuoti su turimomis detalėmis.",
  },
  {
    question: "Ar galima atšaukti pre-order?",
    answer: "Taip, galite atšaukti pre-order bet kada iki išsiuntimo ir grąžiname pilną sumą. Jokių papildomų mokesčių ar sąlygų.",
  },
  {
    question: "Kaip veikia pristatymas?",
    answer: "Pristatymas į paštomatą Lietuvoje yra nemokamas. Sandėlyje esančios prekės išsiunčiamos per 1-2 darbo dienas. Pre-order užsakymai siunčiami iškart kai gauna partiją.",
  },
  {
    question: "Ką daryti, jei trūksta detalių?",
    answer: "Susisiekite su mumis el. paštu su užsakymo numeriu ir trūkstamų detalių nuotraukomis. Trūkstamas detales išsiunčiame nemokamai per 5-7 darbo dienas.",
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
