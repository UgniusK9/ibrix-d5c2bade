import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Clock, Truck, RotateCcw, Shield, CreditCard, Cookie, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.webp";
import logoPng from "@/assets/logo.png";
import { useCookieConsentStore } from "@/stores/cookieConsentStore";
import { useTranslation } from "react-i18next";

const paymentMethods = ["Visa", "Mastercard"];
const shippingPartners = ["Omniva", "LP EXPRESS", "DPD"];

export function Footer() {
  const { openModal } = useCookieConsentStore();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const footerTrustBadges = [
    { icon: Truck, title: t('misc.trustBadge1'), description: t('header.freeShipping') },
    { icon: RotateCcw, title: t('misc.trustBadge2'), description: t('nav.returns') },
    { icon: Shield, title: t('checkout.paymentMethod'), description: "SSL" },
    { icon: CreditCard, title: t('footer.paymentMethods'), description: t('checkout.card') },
  ];

  const footerLinks = {
    narsyti: [
      { name: t('nav.constructors'), href: "/produktai/visi" },
      { name: t('nav.preOrder'), href: "/pre-order" },
      { name: t('nav.guides'), href: "/patarimai" },
      { name: t('nav.about'), href: "/apie" },
      { name: t('nav.contact'), href: "/kontaktai" },
    ],
    informacija: [
      { name: t('nav.delivery'), href: "/pristatymas" },
      { name: t('nav.returns'), href: "/grazinimai" },
      { name: t('nav.warranty'), href: "/garantija" },
      { name: t('nav.missingParts'), href: "/trukstamos-detales" },
      { name: t('nav.privacy'), href: "/privatumo-politika" },
      { name: t('nav.cookies'), href: "/slapukai" },
      { name: t('nav.terms'), href: "/taisykles" },
    ],
  };

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
      toast.success(t('footer.subscribed'));
    } catch (err: any) {
      console.error('Newsletter subscribe error:', err);
      toast.error(t('common.error'));
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
                {t('footer.newsletter')}
              </h3>
              <p className="text-primary-foreground/70 text-sm">
                {t('footer.newsletterDesc')}
              </p>
            </div>
            <div>
              {subscribed ? (
                <div className="flex items-center gap-3 bg-primary-foreground/10 rounded-xl px-5 py-4">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-primary-foreground">{t('common.success')}</p>
                    <p className="text-sm text-primary-foreground/70">{t('footer.subscribed')}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={t('footer.emailPlaceholder')}
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
                        {t('footer.subscribe')}
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
              <picture>
                <source srcSet={logo} type="image/webp" />
                <img src={logoPng} alt="IBRIX" width={96} height={32} loading="lazy" className="h-8 w-auto brightness-0 invert" />
              </picture>
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

          {/* Browse */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4">
              {t('footer.quickLinks')}
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

          {/* Information */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4">
              {t('nav.information')}
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

          {/* Contact */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4">
              {t('footer.contact')}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-accent mt-0.5" />
                <div>
                  <p className="text-footer-foreground/50 text-xs">{t('checkout.email')}</p>
                  <a href="mailto:support@ibrix.lt" className="text-footer-foreground hover:text-accent transition-colors">
                    support@ibrix.lt
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-accent mt-0.5" />
                <div>
                  <p className="text-footer-foreground/50 text-xs">{t('checkout.city')}</p>
                  <span className="text-footer-foreground/90">Vilnius, Lietuva</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-accent mt-0.5" />
                <div>
                  <p className="text-footer-foreground/50 text-xs">{t('misc.workingHours')}</p>
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
              © {new Date().getFullYear()} IBRIX. {t('footer.allRights')}.
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
