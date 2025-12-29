import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Kas yra pre-order?",
    answer: "Pre-order – tai išankstinis užsakymas. Rezervuojate produktą iš artimiausios partijos, kurią atvešime. Terminas visada nurodytas produkto puslapyje. Galite atšaukti bet kada iki išsiuntimo ir grąžiname pilną sumą.",
  },
  {
    question: "Kiek laiko užtrunka pristatymas?",
    answer: "Pre-order produktai pristatomi per 8–10 savaičių. Sandėlyje esantys produktai išsiunčiami per 1–2 darbo dienas. Pristatymas į paštomatą Lietuvoje – nemokamas.",
  },
  {
    question: "Ar galiu grąžinti produktą?",
    answer: "Taip, turite 14 dienų grąžinimo teisę nuo prekės gavimo dienos. Produktas turi būti nenaudotas ir originalioje pakuotėje. Pre-order užsakymus galite atšaukti bet kada iki išsiuntimo.",
  },
  {
    question: "Ką daryti, jei trūksta detalių?",
    answer: "Susisiekite su mumis el. paštu info@ibrix.lt su užsakymo numeriu ir trūkstamų detalių nuotraukomis. Trūkstamas detales išsiunčiame nemokamai.",
  },
  {
    question: "Ar produktai turi garantiją?",
    answer: "Taip, visiems produktams taikoma 24 mėnesių garantija gamybos defektams. Jei pastebėjote defektą, susisiekite su mumis per 14 dienų nuo prekės gavimo.",
  },
];

export function FAQSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Dažnai užduodami klausimai
            </h2>
            <p className="text-muted-foreground">
              Turite klausimų? Radome atsakymus į dažniausiai užduodamus
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl px-6 border border-border shadow-sm"
              >
                <AccordionTrigger className="text-left font-heading font-semibold hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
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
