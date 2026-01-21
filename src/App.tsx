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
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Varikliai from "./pages/Varikliai";
import Produktai from "./pages/Produktai";
import PreOrder from "./pages/PreOrder";
import Pagalba from "./pages/Pagalba";
import Apie from "./pages/Apie";
import Kontaktai from "./pages/Kontaktai";
import Produktas from "./pages/Produktas";
import Pristatymas from "./pages/Pristatymas";
import Grazinimai from "./pages/Grazinimai";
import Garantija from "./pages/Garantija";
import TrukstamosDetales from "./pages/TrukstamosDetales";
import PrivatumoPolitika from "./pages/PrivatumoPolitika";
import SlapukaiPolitika from "./pages/SlapukaiPolitika";
import Taisykles from "./pages/Taisykles";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Admin from "./pages/Admin";
import SiuntosSekimas from "./pages/SiuntosSekimas";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Account from "./pages/Account";
import AdminVerification from "./pages/AdminVerification";
import GiftCards from "./pages/GiftCards";
import Palyginti from "./pages/Palyginti";
import Atsiliepimai from "./pages/Atsiliepimai";
import AuthLanding from "./pages/auth/AuthLanding";
import AuthLogin from "./pages/auth/AuthLogin";
import SignupStep1 from "./pages/auth/SignupStep1";
import SignupStep2 from "./pages/auth/SignupStep2";
import VerifyEmail from "./pages/auth/VerifyEmail";
import AuthSuccess from "./pages/auth/AuthSuccess";
import Credits from "./pages/account/Credits";
import Settings from "./pages/account/Settings";
import MyBuilders from "./pages/account/MyBuilders";
import CollectionSearch from "./pages/account/CollectionSearch";
import Orders from "./pages/Orders";
import Wishlist from "./pages/Wishlist";
import Pokalbis from "./pages/Pokalbis";

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
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                {/* Redirect legacy /varikliai to new unified URL structure */}
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
            </CookieConsentProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
