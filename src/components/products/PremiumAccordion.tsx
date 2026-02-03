import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const PremiumAccordion = AccordionPrimitive.Root;

const PremiumAccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "bg-card rounded-xl border border-border/60 overflow-hidden transition-all duration-200",
      "data-[state=open]:border-primary/30 data-[state=open]:shadow-sm",
      className
    )}
    {...props}
  />
));
PremiumAccordionItem.displayName = "PremiumAccordionItem";

const PremiumAccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    icon?: React.ReactNode;
  }
>(({ className, children, icon, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center gap-4 px-5 py-4 text-left transition-all duration-200",
        "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        "[&[data-state=open]>svg.chevron]:rotate-180",
        "[&[data-state=open]]:bg-muted/20",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </span>
      )}
      <span className="flex-1 font-heading text-base font-semibold text-foreground tracking-tight">
        {children}
      </span>
      <ChevronDown className="chevron h-5 w-5 text-muted-foreground transition-transform duration-300 ease-out" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
PremiumAccordionTrigger.displayName = "PremiumAccordionTrigger";

const PremiumAccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden transition-all duration-300 ease-out",
      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    )}
    {...props}
  >
    <div className={cn(
      "px-5 pb-5 pt-0 border-t border-border/40",
      className
    )}>
      <div className="pt-4 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  </AccordionPrimitive.Content>
));
PremiumAccordionContent.displayName = "PremiumAccordionContent";

// Styled list components for content
const AccordionList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <ul className={cn("space-y-2.5", className)}>
    {children}
  </ul>
);

const AccordionListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-muted-foreground">
    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
    <span>{children}</span>
  </li>
);

// Styled spec table for specifications
const AccordionSpecTable = ({ specs }: { specs: { label: string; value: string }[] }) => (
  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
    {specs.map((spec, idx) => (
      <div key={idx} className="flex flex-col">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground/70 mb-0.5">{spec.label}</dt>
        <dd className="font-medium text-foreground">{spec.value}</dd>
      </div>
    ))}
  </div>
);

// FAQ item component
const AccordionFaqItem = ({ question, answer }: { question: string; answer: string }) => (
  <div className="pb-4 last:pb-0 border-b border-border/30 last:border-0">
    <h4 className="font-medium text-foreground mb-1.5">{question}</h4>
    <p className="text-muted-foreground leading-relaxed">{answer}</p>
  </div>
);

export { 
  PremiumAccordion, 
  PremiumAccordionItem, 
  PremiumAccordionTrigger, 
  PremiumAccordionContent,
  AccordionList,
  AccordionListItem,
  AccordionSpecTable,
  AccordionFaqItem,
};
