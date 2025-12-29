import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Varikliai from "./pages/Varikliai";
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
import Taisykles from "./pages/Taisykles";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/varikliai" element={<Varikliai />} />
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
          <Route path="/taisykles" element={<Taisykles />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
