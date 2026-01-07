import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, ShoppingCart, Truck, Clock, Headphones, ArrowRight, User, LogOut, ChevronDown, FileText, Shield, Cookie, Undo2, Star, HelpCircle, Package, Heart, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore } from "@/stores/cartStore";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { ProductSearch } from "@/components/header/ProductSearch";
import { CategoriesMegaMenu } from "@/components/header/CategoriesMegaMenu";
import { LanguageSelector } from "@/components/header/LanguageSelector";
import { UserProfileDropdown } from "@/components/header/UserProfileDropdown";
import logo from "@/assets/logo.png";

const navigation = [
  { name: "Kaip veikia pre-order", href: "/pre-order" },
  { name: "Pagalba", href: "/pagalba" },
  { name: "Apie mus", href: "/apie" },
  { name: "Kontaktai", href: "/kontaktai" },
];

const infoLinks = [
  { name: "Pristatymas", href: "/pristatymas", icon: Truck },
  { name: "Grąžinimai", href: "/grazinimai", icon: Undo2 },
  { name: "Garantija", href: "/garantija", icon: Shield },
  { name: "Atsiliepimai", href: "/atsiliepimai", icon: Star },
  { name: "D.U.K", href: "/pagalba#faq", icon: HelpCircle },
  { name: "Taisyklės", href: "/taisykles", icon: FileText },
  { name: "Privatumo politika", href: "/privatumo-politika", icon: FileText },
  { name: "Slapukų politika", href: "/slapukai", icon: Cookie },
];

const topBarItems = [
  { icon: Truck, text: "Nemokamas pristatymas LT į paštomatą" },
  { icon: Clock, text: "Pre-order su aiškiu pristatymo terminu" },
  { icon: Headphones, text: "Pagalba lietuviškai + trūkstamų detalių sprendimas" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const setCartOpen = useCartStore((state) => state.setOpen);
  const { user, isAdmin, signOut } = useAuth();

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
              <img src={logo} alt="IBRIX" className="h-10 md:h-12 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {/* Products Mega Menu */}
              <CategoriesMegaMenu />
              
              {/* Informacija Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1">
                    Informacija
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-popover border border-border z-50">
                  {infoLinks.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link to={item.href} className="flex items-center gap-2 cursor-pointer">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive(item.href)
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Search - Desktop */}
            <div className="hidden lg:block">
              <ProductSearch />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* CTA Button - Desktop only */}
              <Button asChild size="sm" className="hidden lg:flex bg-accent hover:bg-accent/90 text-accent-foreground h-9 px-4">
                <Link to="/produktai/visi">
                  {t('nav.viewConstructors')}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>

              {/* User Account */}
              {user ? (
                <div className="hidden lg:flex items-center">
                  <UserProfileDropdown />
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Link to="/auth/login">
                      {t('header.login')}
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link to="/auth/signup/step-1">
                      {t('header.signUp')}
                    </Link>
                  </Button>
                </div>
              )}

              {/* Language Selector */}
              <LanguageSelector />

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
                  
                  <div className="mt-6 px-4 space-y-2">
                    <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Link to="/produktai/visi" onClick={() => setMobileMenuOpen(false)}>
                        {t('nav.viewConstructors')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    
                    {user ? (
                      <div className="space-y-1 pt-2">
                        <Link
                          to="/account"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <User className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{t('account.myAccount')}</span>
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{t('account.myOrders')}</span>
                        </Link>
                        <Link
                          to="/account"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Heart className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{t('account.wishlist')}</span>
                        </Link>
                        <Link
                          to="/account/credits"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Gift className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{t('account.rewards')}</span>
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            <span className="font-medium">{t('header.admin')}</span>
                          </Link>
                        )}
                        <button
                          onClick={() => { signOut(); setMobileMenuOpen(false); }}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors w-full text-left text-destructive"
                        >
                          <LogOut className="h-5 w-5" />
                          <span className="font-medium">{t('auth.logout')}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                          <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                            {t('header.login')}
                          </Link>
                        </Button>
                        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                          <Link to="/auth/signup/step-1" onClick={() => setMobileMenuOpen(false)}>
                            {t('header.signUp')}
                          </Link>
                        </Button>
                      </div>
                    )}
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
