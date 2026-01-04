import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Clock, Truck, RotateCcw, Shield, CreditCard, Cookie, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useCookieConsentStore } from "@/stores/cookieConsentStore";

const footerTrustBadges = [
  { icon: Truck, title: "Nemokamas pristatymas", description: "Į paštomatą Lietuvoje" },
  { icon: RotateCcw, title: "Grąžinimas per 14 d.", description: "Be papildomų klausimų" },
  { icon: Shield, title: "Saugūs mokėjimai", description: "SSL šifravimas" },
  { icon: CreditCard, title: "Patogūs mokėjimai", description: "Kortelė, bankas" },
];

const footerLinks = {
  narsyti: [
    { name: "Produktai", href: "/produktai/visi" },
    { name: "Kaip veikia Pre-Order", href: "/pre-order" },
    { name: "Apie mus", href: "/apie" },
    { name: "Kontaktai", href: "/kontaktai" },
  ],
  informacija: [
    { name: "Pristatymas", href: "/pristatymas" },
    { name: "Grąžinimai", href: "/grazinimai" },
    { name: "Garantija", href: "/garantija" },
    { name: "Trūkstamos detalės", href: "/trukstamos-detales" },
    { name: "Privatumo politika", href: "/privatumo-politika" },
    { name: "Slapukų politika", href: "/slapukai" },
    { name: "Taisyklės ir sąlygos", href: "/taisykles" },
  ],
};

const paymentMethods = ["Visa", "Mastercard"];
const shippingPartners = ["Omniva", "LP EXPRESS", "DPD"];

export function Footer() {
  const { openModal } = useCookieConsentStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .upsert(
          { email: email.trim().toLowerCase(), status: 'active', subscribed_at: new Date().toISOString() },
          { onConflict: 'email' }
        );
      
      if (error) throw error;
      setSubscribed(true);
      setEmail("");
      toast.success("Sėkmingai užsiprenumeravote!");
    } catch (err: any) {
      console.error('Newsletter subscribe error:', err);
      toast.error("Nepavyko užsiprenumeruoti");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <footer className="bg-footer text-footer-foreground">
      {/* Newsletter Section */}
      <div className="bg-primary">
        <div className="container py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-primary-foreground mb-2">
                Prisijunk prie IBRIX bendruomenės
              </h3>
              <p className="text-primary-foreground/70 text-sm">
                Gauk naujienas apie naujus produktus, akcijas ir išskirtinius pasiūlymus.
              </p>
            </div>
            <div>
              {subscribed ? (
                <div className="flex items-center gap-3 bg-primary-foreground/10 rounded-xl px-5 py-4">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-primary-foreground">Ačiū!</p>
                    <p className="text-sm text-primary-foreground/70">Sėkmingai užsiprenumeravote naujienlaiškį.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="El. pašto adresas"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:border-primary-foreground/40"
                  />
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Prenumeruoti
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trust badges bar */}
      <div className="border-b border-footer-foreground/10">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {footerTrustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <badge.icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-footer-foreground">{badge.title}</p>
                  <p className="text-xs text-footer-foreground/60">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <img src={logo} alt="IBRIX" className="h-8 w-auto brightness-0 invert" />
            </Link>
            <p className="text-footer-foreground/70 text-sm leading-relaxed mb-6">
              IBRIX – judantys mechaniniai konstruktoriai mechanikos fanams. Aiškus pre-order, 
              pristatymas Lietuvoje ir pagalba lietuviškai.
            </p>
            
            {/* Payment methods */}
            <div className="mb-4">
              <p className="text-xs text-footer-foreground/50 uppercase tracking-wider mb-2">
                Apmokėjimo būdai
              </p>
              <div className="flex flex-wrap gap-1.5">
                {paymentMethods.map((method) => (
                  <span key={method} className="px-2 py-1 text-xs bg-footer-foreground/10 rounded text-footer-foreground/70">
                    {method}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Shipping */}
            <div>
              <p className="text-xs text-footer-foreground/50 uppercase tracking-wider mb-2">
                Pristatymo partneriai
              </p>
              <div className="flex flex-wrap gap-1.5">
                {shippingPartners.map((partner) => (
                  <span key={partner} className="px-2 py-1 text-xs bg-footer-foreground/10 rounded text-footer-foreground/70">
                    {partner}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Naršyti */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4">
              Naršyti
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.narsyti.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informacija */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4">
              Informacija
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.informacija.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontaktai */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4">
              Kontaktai
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-accent mt-0.5" />
                <div>
                  <p className="text-footer-foreground/50 text-xs">El. paštas</p>
                  <a href="mailto:support@ibrix.lt" className="text-footer-foreground hover:text-accent transition-colors">
                    support@ibrix.lt
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-accent mt-0.5" />
                <div>
                  <p className="text-footer-foreground/50 text-xs">Miestas</p>
                  <span className="text-footer-foreground/90">Vilnius, Lietuva</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-accent mt-0.5" />
                <div>
                  <p className="text-footer-foreground/50 text-xs">Darbo laikas</p>
                  <span className="text-footer-foreground/90">I-V 10:00-18:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-footer-foreground/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-footer-foreground/50">
              © {new Date().getFullYear()} IBRIX. Visos teisės saugomos.
            </p>
            <button
              onClick={openModal}
              className="flex items-center gap-2 text-xs text-footer-foreground/50 hover:text-footer-foreground transition-colors"
            >
              <Cookie className="h-3.5 w-3.5" />
              Slapukų nustatymai
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
