import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, ShoppingCart, Truck, Clock, Headphones, ArrowRight, User, LogOut, ChevronDown, FileText, Shield, Cookie, Undo2, Star, HelpCircle, Package, Heart, Gift, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore } from "@/stores/cartStore";

import { useAuth } from "@/contexts/AuthContext";
import { ProductSearch } from "@/components/header/ProductSearch";
import { CategoriesMegaMenu } from "@/components/header/CategoriesMegaMenu";
import { LanguageSelector } from "@/components/header/LanguageSelector";
import { UserProfileDropdown } from "@/components/header/UserProfileDropdown";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import logo from "@/assets/logo.webp";
import logoPng from "@/assets/logo.png";

const navigation = [
  { name: "Kaip veikia pre-order", href: "/pre-order" },
  { name: "Straipsniai", href: "/patarimai" },
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
  { icon: Truck, text: "Nemokamas pristatymas LT" },
  { icon: Clock, text: "Aiškus pre-order terminas" },
  { icon: Headphones, text: "Pagalba lietuviškai" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const setCartOpen = useCartStore((state) => state.setOpen);
  const { user, isAdmin, signOut } = useAuth();

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 bg-card shadow-soft w-full min-w-0">
      {/* Top Bar - LEGO-like bright strip */}
      <div className="bg-primary w-full">
        <div className="container max-w-full px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 md:gap-8 py-2 text-xs md:text-sm">
            {topBarItems.map((item, index) => (
              <span key={index} className="hidden md:inline-flex items-center gap-2 whitespace-nowrap text-primary-foreground/90 font-medium flex-shrink-0">
                <item.icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
                <span className="truncate">{item.text}</span>
              </span>
            ))}
            {/* Mobile - show only first item */}
            <span className="md:hidden inline-flex items-center gap-2 text-primary-foreground font-medium">
              <Truck className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
              <span className="truncate">{topBarItems[0].text}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-card border-b border-border w-full">
        <div className="container max-w-full px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18 gap-2 md:gap-4 min-w-0">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <picture>
                <source srcSet={logo} type="image/webp" />
                <img src={logoPng} alt="IBRIX" width={120} height={80} className="h-10 md:h-12 w-auto max-w-[120px] md:max-w-none object-contain dark:bg-white dark:rounded-lg dark:px-2 dark:py-1" fetchPriority="high" />
              </picture>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 flex-shrink-0 min-w-0">
              {/* Products Mega Menu */}
              <CategoriesMegaMenu />
              
              {/* Informacija Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 xl:px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap text-foreground/70 hover:text-foreground hover:bg-secondary flex items-center gap-1.5 flex-shrink-0">
                    Informacija
                    <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 p-2">
                  {infoLinks.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link to={item.href} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg">
                        <item.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                  className={`px-3 xl:px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                    isActive(item.href)
                      ? "text-primary bg-primary/10"
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Search - Desktop */}
            <div className="hidden lg:block flex-1 max-w-xs xl:max-w-sm mx-4 xl:mx-6 min-w-0">
              <ProductSearch />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {/* Mobile Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* CTA Button - Desktop only */}
              <Button asChild size="sm" variant="accent" className="hidden xl:flex h-10 px-4 xl:px-5 flex-shrink-0">
                <Link to="/produktai/visi">
                  <span className="truncate">{t('nav.viewConstructors')}</span>
                  <ArrowRight className="ml-1.5 h-4 w-4 flex-shrink-0" />
                </Link>
              </Button>

              {/* User Account */}
              {user ? (
                <div className="hidden lg:flex items-center">
                  <UserProfileDropdown />
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/auth/login">
                      {t('header.login')}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/auth/signup/step-1">
                      {t('header.signUp')}
                    </Link>
                  </Button>
                </div>
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

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
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs bg-accent text-accent-foreground font-bold border-2 border-card">
                    {totalItems > 9 ? '9+' : totalItems}
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
                <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
                  <SheetHeader className="p-6 border-b border-border">
                    <SheetTitle className="text-left">Meniu</SheetTitle>
                  </SheetHeader>
                  
                  <div className="p-4">
                    <nav className="flex flex-col gap-1">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                            isActive(item.href)
                              ? "bg-primary/10 text-primary"
                              : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                    
                    <div className="mt-6 space-y-3">
                      <Button asChild variant="accent" size="lg" className="w-full">
                        <Link to="/produktai/visi" onClick={() => setMobileMenuOpen(false)}>
                          {t('nav.viewConstructors')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      
                      {user ? (
                        <div className="space-y-1 pt-4 border-t border-border">
                          <Link
                            to="/account"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
                          >
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{t('account.myAccount')}</span>
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
                          >
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{t('account.myOrders')}</span>
                          </Link>
                          <Link
                            to="/wishlist"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
                          >
                            <Heart className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{t('account.wishlist')}</span>
                          </Link>
                          <Link
                            to="/account/credits"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
                          >
                            <Gift className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{t('account.rewards')}</span>
                          </Link>
                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
                            >
                              <Shield className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">{t('header.admin')}</span>
                            </Link>
                          )}
                          <button
                            onClick={() => { signOut(); setMobileMenuOpen(false); }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 transition-colors w-full text-left text-destructive"
                          >
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium">{t('auth.logout')}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-4 border-t border-border">
                          <Button asChild variant="outline" className="w-full">
                            <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                              {t('header.login')}
                            </Link>
                          </Button>
                          <Button asChild className="w-full">
                            <Link to="/auth/signup/step-1" onClick={() => setMobileMenuOpen(false)}>
                              {t('header.signUp')}
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="flex-1">
              <ProductSearch autoFocus onSelect={() => setMobileSearchOpen(false)} />
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMobileSearchOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* CartDrawer is rendered globally in App.tsx */}
    </header>
  );
}
