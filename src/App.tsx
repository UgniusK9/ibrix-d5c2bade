import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentProvider";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AddToCartModal } from "@/components/cart/AddToCartModal";
import { ComparisonDrawer } from "@/components/products/ComparisonDrawer";
import { useCartStore } from "@/stores/cartStore";
import { lazy, Suspense } from "react";
const Index = lazy(() => import("./pages/Index"));

// Lazy load all non-critical routes
const NotFound = lazy(() => import("./pages/NotFound"));
const Produktai = lazy(() => import("./pages/Produktai"));
const PreOrder = lazy(() => import("./pages/PreOrder"));
const Pagalba = lazy(() => import("./pages/Pagalba"));
const Apie = lazy(() => import("./pages/Apie"));
const Kontaktai = lazy(() => import("./pages/Kontaktai"));
const Produktas = lazy(() => import("./pages/Produktas"));
const Pristatymas = lazy(() => import("./pages/Pristatymas"));
const Grazinimai = lazy(() => import("./pages/Grazinimai"));
const Garantija = lazy(() => import("./pages/Garantija"));
const TrukstamosDetales = lazy(() => import("./pages/TrukstamosDetales"));
const PrivatumoPolitika = lazy(() => import("./pages/PrivatumoPolitika"));
const SlapukaiPolitika = lazy(() => import("./pages/SlapukaiPolitika"));
const Taisykles = lazy(() => import("./pages/Taisykles"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Admin = lazy(() => import("./pages/Admin"));
const SiuntosSekimas = lazy(() => import("./pages/SiuntosSekimas"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Account = lazy(() => import("./pages/Account"));
const AdminVerification = lazy(() => import("./pages/AdminVerification"));
const GiftCards = lazy(() => import("./pages/GiftCards"));
const Palyginti = lazy(() => import("./pages/Palyginti"));
const Atsiliepimai = lazy(() => import("./pages/Atsiliepimai"));
const AuthLanding = lazy(() => import("./pages/auth/AuthLanding"));
const AuthLogin = lazy(() => import("./pages/auth/AuthLogin"));
const SignupStep1 = lazy(() => import("./pages/auth/SignupStep1"));
const SignupStep2 = lazy(() => import("./pages/auth/SignupStep2"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const AuthSuccess = lazy(() => import("./pages/auth/AuthSuccess"));
const Credits = lazy(() => import("./pages/account/Credits"));
const Settings = lazy(() => import("./pages/account/Settings"));
const MyBuilders = lazy(() => import("./pages/account/MyBuilders"));
const CollectionSearch = lazy(() => import("./pages/account/CollectionSearch"));
const Orders = lazy(() => import("./pages/Orders"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Pokalbis = lazy(() => import("./pages/Pokalbis"));
const Varikliai = lazy(() => import("./pages/Varikliai"));

// Global cart components wrapper
function CartComponents() {
  const { lastAddedItem, isModalOpen, setModalOpen } = useCartStore();
  
  return (
    <>
      <CartDrawer />
      <AddToCartModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        item={lastAddedItem} 
      />
      <ComparisonDrawer />
    </>
  );
}

const queryClient = new QueryClient();

// Minimal loading fallback
const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <HelmetProvider>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <AuthProvider>
              <CookieConsentProvider>
                <PageViewTracker />
                <CartComponents />
              <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/varikliai" element={<Navigate to="/produktai/varikliai" replace />} />
                <Route path="/produktai/:category" element={<Produktai />} />
                <Route path="/produktai" element={<Navigate to="/produktai/visi" replace />} />
                <Route path="/pre-order" element={<PreOrder />} />
                <Route path="/pagalba" element={<Pagalba />} />
                <Route path="/apie" element={<Apie />} />
                <Route path="/kontaktai" element={<Kontaktai />} />
                <Route path="/produktas/:handle" element={<Produktas />} />
                <Route path="/pristatymas" element={<Pristatymas />} />
                <Route path="/grazinimai" element={<Grazinimai />} />
                <Route path="/garantija" element={<Garantija />} />
                <Route path="/trukstamos-detales" element={<TrukstamosDetales />} />
                <Route path="/privatumo-politika" element={<PrivatumoPolitika />} />
                <Route path="/slapukai" element={<SlapukaiPolitika />} />
                <Route path="/taisykles" element={<Taisykles />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/uzsakymas" element={<OrderConfirmation />} />
                <Route path="/siuntos-sekimas/:orderId" element={<SiuntosSekimas />} />
                <Route path="/siuntos-sekimas" element={<SiuntosSekimas />} />
                <Route path="/dovanu-kuponai" element={<GiftCards />} />
                <Route path="/palyginti" element={<Palyginti />} />
                <Route path="/atsiliepimai" element={<Atsiliepimai />} />
                <Route path="/pokalbis/:token" element={<Pokalbis />} />
                <Route path="/auth" element={<AuthLanding />} />
                <Route path="/auth/login" element={<AuthLogin />} />
                <Route path="/auth/signup/step-1" element={<SignupStep1 />} />
                <Route path="/auth/signup/step-2" element={<SignupStep2 />} />
                <Route path="/auth/verify-email" element={<VerifyEmail />} />
                <Route path="/auth/success" element={<AuthSuccess />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/legacy" element={<Auth />} />

                {/* Protected: Customer account */}
                <Route path="/account" element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                } />
                <Route path="/account/credits" element={
                  <ProtectedRoute>
                    <Credits />
                  </ProtectedRoute>
                } />
                <Route path="/account/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/account/my-builders" element={
                  <ProtectedRoute>
                    <MyBuilders />
                  </ProtectedRoute>
                } />
                <Route path="/account/collection-search" element={
                  <ProtectedRoute>
                    <CollectionSearch />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                } />
                <Route path="/wishlist" element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                } />

                {/* Protected: Admin only */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="/admin/verification" element={
                  <ProtectedRoute requireAdmin>
                    <AdminVerification />
                  </ProtectedRoute>
                } />
                <Route path="/admin/*" element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </CookieConsentProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
