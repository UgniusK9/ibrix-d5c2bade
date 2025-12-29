import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, ShoppingCart, Truck, Clock, Headphones, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cartStore";
import { CartDrawer } from "@/components/cart/CartDrawer";
import logo from "@/assets/logo.png";

const navigation = [
  { name: "Varikliai", href: "/varikliai" },
  { name: "Kaip veikia Pre-Order", href: "/pre-order" },
  { name: "Pagalba", href: "/pagalba" },
  { name: "Apie mus", href: "/apie" },
  { name: "Kontaktai", href: "/kontaktai" },
];

const topBarItems = [
  { icon: Truck, text: "Nemokamas pristatymas LT į paštomatą" },
  { icon: Clock, text: "Pre-order su aiškiu terminu" },
  { icon: Headphones, text: "Pagalba lietuviškai + trūkstamos detalės" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const setCartOpen = useCartStore((state) => state.setOpen);

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container">
          <div className="flex items-center justify-center gap-8 py-2 text-xs md:text-sm overflow-hidden">
            {topBarItems.map((item, index) => (
              <span key={index} className="hidden md:inline-flex items-center gap-2 whitespace-nowrap">
                <item.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {item.text}
              </span>
            ))}
            {/* Mobile - show only first item */}
            <span className="md:hidden inline-flex items-center gap-2">
              <Truck className="h-3.5 w-3.5" strokeWidth={1.5} />
              {topBarItems[0].text}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-card border-b border-border">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img src={logo} alt="IBRIX" className="h-7 md:h-8 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* CTA Button - Desktop only */}
              <Button asChild size="sm" className="hidden lg:flex bg-accent hover:bg-accent/90 text-accent-foreground h-9 px-4">
                <Link to="/varikliai">
                  Peržiūrėti variklius
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-accent text-accent-foreground border-2 border-card">
                    {totalItems}
                  </Badge>
                )}
              </Button>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                  <nav className="flex flex-col gap-1 mt-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                          isActive(item.href)
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                  
                  <div className="mt-6 px-4">
                    <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Link to="/varikliai" onClick={() => setMobileMenuOpen(false)}>
                        Peržiūrėti variklius
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </header>
  );
}
