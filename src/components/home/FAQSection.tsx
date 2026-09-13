import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = Array.from({ length: 10 }, (_, i) => ({ question: `faq.q${i + 1}`, answer: `faq.a${i + 1}` }));

export function FAQSection() {
  const { t } = useTranslation();
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-2 block">
              {t('faq.shortTitle')}
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              {t('faq.title')}
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
                  {t(faq.question)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 text-sm leading-relaxed">
                  {t(faq.answer)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
