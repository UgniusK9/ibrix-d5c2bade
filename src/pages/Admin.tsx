import { useState, useEffect } from "react";
import { Package, Settings, List, BarChart3, Tag, RefreshCw, ShoppingBag, Users, RotateCcw, Layers } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSetup } from "@/components/admin/AdminSetup";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { OrdersManager } from "@/components/admin/OrdersManager";
import { OffersManager } from "@/components/admin/OffersManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { RefundsManager } from "@/components/admin/RefundsManager";
import { BundlesManager } from "@/components/admin/BundlesManager";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface WebhookHealth {
  status: string;
  config: {
    stripe_secret_configured: boolean;
    webhook_secret_configured: boolean;
    supabase_url_configured: boolean;
    service_role_configured: boolean;
    resend_configured: boolean;
  };
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('orders');
  const [webhookHealth, setWebhookHealth] = useState<WebhookHealth | null>(null);

  const loadWebhookHealth = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook?health=true`,
        { method: 'GET' }
      );
      const data = await response.json();
      setWebhookHealth(data);
    } catch (e) {
      console.error('Failed to load webhook health:', e);
    }
  };

  useEffect(() => {
    loadWebhookHealth();
  }, []);

  return (
    <PageLayout>
      <div className="container py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">Administravimas</h1>
            <p className="text-muted-foreground">Produktų, užsakymų ir sistemos valdymas</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/verification">
              <BarChart3 className="w-4 h-4 mr-2" />
              Patikra
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="orders" className="gap-2">
              <List className="w-4 h-4" />
              Užsakymai
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              Produktai
            </TabsTrigger>
            <TabsTrigger value="offers" className="gap-2">
              <Tag className="w-4 h-4" />
              Pasiūlymai
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analitika
            </TabsTrigger>
            <TabsTrigger value="refunds" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Grąžinimai
            </TabsTrigger>
            <TabsTrigger value="setup" className="gap-2">
              <Settings className="w-4 h-4" />
              Nustatymai
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrdersManager />
          </TabsContent>

          <TabsContent value="products">
            <ProductsManager />
          </TabsContent>

          <TabsContent value="offers">
            <OffersManager />
            <div className="mt-8">
              <BundlesManager />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p><strong>Testavimo instrukcijos:</strong></p>
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>GA4: Google Analytics → Realtime → DebugView (reikia GA Debug extension)</li>
                <li>Meta CAPI: Events Manager → Test Events → Server Events</li>
                <li>Sitemap: <a href="/api/sitemap" target="_blank" className="underline">Dinaminis sitemap.xml</a></li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="refunds">
            <RefundsManager />
          </TabsContent>

          <TabsContent value="setup">
            <AdminSetup webhookHealth={webhookHealth} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
