import { Link } from "react-router-dom";
import { Mail, MapPin, Clock } from "lucide-react";
import logo from "@/assets/logo.png";

const footerLinks = {
  parduotuve: [
    { name: "Varikliai", href: "/varikliai" },
    { name: "Pre-order", href: "/pre-order" },
  ],
  pagalba: [
    { name: "Pristatymas", href: "/pagalba/pristatymas" },
    { name: "Grąžinimai", href: "/pagalba/grazinimai" },
    { name: "Garantija", href: "/pagalba/garantija" },
    { name: "Trūkstamos detalės", href: "/pagalba/trukstamos-detales" },
  ],
  informacija: [
    { name: "Apie mus", href: "/apie" },
    { name: "Kontaktai", href: "/kontaktai" },
    { name: "Privatumo politika", href: "/privatumo-politika" },
    { name: "Pirkimo taisyklės", href: "/taisykles" },
  ],
};

const paymentMethods = ["Visa", "Mastercard", "PayPal"];
const shippingPartners = ["Omniva", "LP Express", "DPD"];

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src={logo} alt="Ibrix.lt" className="h-10 w-auto brightness-0 invert" />
            </Link>
            <p className="text-footer-foreground/70 text-sm leading-relaxed max-w-sm mb-6">
              Premium techninių konstruktorių variklio modeliai mechanikos fanams. 
              Kiekvienas modelis – tikra inžinerijos dovana.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-footer-foreground/70">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@ibrix.lt</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Vilnius, Lietuva</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>I–V: 9:00–18:00</span>
              </div>
            </div>
          </div>

          {/* Parduotuvė */}
          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4">
              Parduotuvė
            </h3>
            <ul className="space-y-2">
              {footerLinks.parduotuve.map((link) => (
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

          {/* Pagalba */}
          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4">
              Pagalba
            </h3>
            <ul className="space-y-2">
              {footerLinks.pagalba.map((link) => (
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
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4">
              Informacija
            </h3>
            <ul className="space-y-2">
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
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-footer-foreground/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Payment & Shipping */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-footer-foreground/50">
              <div className="flex items-center gap-2">
                <span>Mokėjimai:</span>
                {paymentMethods.map((method) => (
                  <span key={method} className="px-2 py-1 bg-footer-foreground/10 rounded">
                    {method}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span>Pristatymas:</span>
                {shippingPartners.map((partner) => (
                  <span key={partner} className="px-2 py-1 bg-footer-foreground/10 rounded">
                    {partner}
                  </span>
                ))}
              </div>
            </div>

            {/* Copyright */}
            <p className="text-xs text-footer-foreground/50">
              © {new Date().getFullYear()} Ibrix.lt. Visos teisės saugomos.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
