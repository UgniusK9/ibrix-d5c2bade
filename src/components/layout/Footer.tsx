import { Link } from "react-router-dom";
import { Mail, MapPin, Clock, Truck, RotateCcw, Shield, CreditCard } from "lucide-react";
import logo from "@/assets/logo.png";

const footerTrustBadges = [
  { icon: Truck, title: "Nemokamas pristatymas", description: "Į paštomatą Lietuvoje" },
  { icon: RotateCcw, title: "Grąžinimas per 14 d.", description: "Be papildomų klausimų" },
  { icon: Shield, title: "Saugūs mokėjimai", description: "SSL šifravimas" },
  { icon: CreditCard, title: "Patogūs mokėjimai", description: "Kortelė, bankas, PayPal" },
];

const footerLinks = {
  narsyti: [
    { name: "Varikliai", href: "/varikliai" },
    { name: "Kaip veikia Pre-Order", href: "/pre-order" },
    { name: "Apie mus", href: "/apie" },
    { name: "Kontaktai", href: "/kontaktai" },
  ],
  informacija: [
    { name: "Pristatymas", href: "/pagalba/pristatymas" },
    { name: "Grąžinimai", href: "/pagalba/grazinimai" },
    { name: "Garantija", href: "/pagalba/garantija" },
    { name: "Trūkstamos detalės", href: "/pagalba/trukstamos-detales" },
    { name: "Privatumo politika", href: "/privatumo-politika" },
    { name: "Taisyklės ir sąlygos", href: "/taisykles" },
  ],
};

const paymentMethods = ["Visa", "Mastercard", "PayPal", "Bankai"];
const shippingPartners = ["Omniva", "LP EXPRESS", "DPD"];

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground">
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
              <img src={logo} alt="Ibrix.lt" className="h-8 w-auto brightness-0 invert" />
            </Link>
            <p className="text-footer-foreground/70 text-sm leading-relaxed mb-6">
              Techninių konstruktorių kolekcija mechanikos fanams. Varikliai, kurie juda.
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
        <div className="mt-12 pt-8 border-t border-footer-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-footer-foreground/50">
            © {new Date().getFullYear()} Ibrix. Visos teisės saugomos.
          </p>
          <p className="text-xs text-footer-foreground/40">
            Įmonės rekvizitai bus paskelbti netrukus
          </p>
        </div>
      </div>
    </footer>
  );
}
