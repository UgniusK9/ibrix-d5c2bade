import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Kiek laiko užtrunka surinkti?",
    answer: "Dažniausiai 20–30 val., priklauso nuo modelio ir patirties. Rekomenduojame rinkti etapais.",
  },
  {
    question: "Ar modelis tikrai juda?",
    answer: "Taip. Mechanizmas juda realiai: stūmokliai, alkūninis velenas ir kitos dalys dirba sinchroniškai.",
  },
  {
    question: "Ar reikia specialių įrankių?",
    answer: "Ne. Reikalingi įrankiai įtraukti. Jei norite patogiau – pravers smulkus pincetas.",
  },
  {
    question: 'Kuo skiriasi "Sandėlyje" ir "Pre-order"?',
    answer: '"Sandėlyje" – išsiunčiame per 1–2 d. "Pre-order" – rezervuojate modelį siuntoje, pristatymas per nurodytą terminą.',
  },
  {
    question: "Ar galima atšaukti pre-order?",
    answer: "Taip, iki išsiuntimo. Grąžiname pilną sumą.",
  },
  {
    question: "Kas jei trūksta detalės?",
    answer: "Parašote mums, nurodote modelį ir detalės numerį – nemokamai išsiunčiame per 5 darbo dienas.",
  },
  {
    question: "Ar tinka dovanai?",
    answer: "Taip. Tai puiki dovana technikos fanams – ypač jei patinka rinkti ir turėti ekspozicijoje.",
  },
  {
    question: "Kokiam amžiui tinka?",
    answer: "Rekomenduojame 16+ (smulkios detalės ir surinkimo sudėtingumas).",
  },
  {
    question: "Kaip veikia grąžinimas?",
    answer: "Per 14 dienų galite grąžinti. Susisiekite – atsiųsime instrukciją.",
  },
  {
    question: "Ar mokėjimai saugūs?",
    answer: "Taip. Naudojame saugius atsiskaitymo sprendimus, SSL šifravimą.",
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
