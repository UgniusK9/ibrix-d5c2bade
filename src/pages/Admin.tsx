import { useState } from "react";
import { Package, Settings, List, BarChart3, Tag, RefreshCw, ShoppingBag, Users, RotateCcw, Layers, Gift, FolderTree, Mail, Image, MessageSquare, Bell, TrendingUp, Wallet, HelpCircle, Eye, Activity, Download, Images } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSetup } from "@/components/admin/AdminSetup";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { OrdersManager } from "@/components/admin/OrdersManager";
import { OffersManager } from "@/components/admin/OffersManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { ProfitMarginReport } from "@/components/admin/ProfitMarginReport";
import { RefundsManager } from "@/components/admin/RefundsManager";
import { BundlesManager } from "@/components/admin/BundlesManager";
import { GiftCardsManager } from "@/components/admin/GiftCardsManager";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { NewsletterManager } from "@/components/admin/NewsletterManager";
import { PromoBannersManager } from "@/components/admin/PromoBannersManager";
import { ReviewsManager } from "@/components/admin/ReviewsManager";
import { StockNotificationsManager } from "@/components/admin/StockNotificationsManager";
import { CreditsManager } from "@/components/admin/CreditsManager";
import { InquiriesManager } from "@/components/admin/InquiriesManager";
import { EmailPreviewManager } from "@/components/admin/EmailPreviewManager";
import { ProductStatsManager } from "@/components/admin/ProductStatsManager";
import { ActiveCartsManager } from "@/components/admin/ActiveCartsManager";
import { ProductImporter } from "@/components/admin/ProductImporter";
import { PhotoImporter } from "@/components/admin/PhotoImporter";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";


export default function Admin() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <PageLayout>
      <div className="container py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">Administravimas</h1>
            <p className="text-muted-foreground">Konstruktorių, užsakymų ir sistemos valdymas</p>
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
              Konstruktoriai
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Download className="w-4 h-4" />
              Importuoti produktus
            </TabsTrigger>
            <TabsTrigger value="import-photos" className="gap-2">
              <Images className="w-4 h-4" />
              Importuoti nuotraukas
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderTree className="w-4 h-4" />
              Kategorijos
            </TabsTrigger>
            <TabsTrigger value="offers" className="gap-2">
              <Tag className="w-4 h-4" />
              Pasiūlymai
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analitika
            </TabsTrigger>
            <TabsTrigger value="profit" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Pelnas
            </TabsTrigger>
            <TabsTrigger value="refunds" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Grąžinimai
            </TabsTrigger>
            <TabsTrigger value="giftcards" className="gap-2">
              <Gift className="w-4 h-4" />
              Kuponai
            </TabsTrigger>
            <TabsTrigger value="newsletter" className="gap-2">
              <Mail className="w-4 h-4" />
              Naujienlaiškis
            </TabsTrigger>
            <TabsTrigger value="banners" className="gap-2">
              <Image className="w-4 h-4" />
              Baneriai
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Atsiliepimai
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              Užklausos
            </TabsTrigger>
            <TabsTrigger value="stock-notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Sandėlis
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-2">
              <Wallet className="w-4 h-4" />
              Kreditai
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2">
              <Eye className="w-4 h-4" />
              El. paštas
            </TabsTrigger>
            <TabsTrigger value="product-stats" className="gap-2">
              <Activity className="w-4 h-4" />
              Produktų statistika
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

          <TabsContent value="import">
            <ProductImporter />
          </TabsContent>

          <TabsContent value="import-photos">
            <PhotoImporter />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesManager />
          </TabsContent>

          <TabsContent value="offers">
            <OffersManager />
            <div className="mt-8">
              <BundlesManager />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
            <div className="mt-8">
              <AnalyticsCharts />
            </div>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p><strong>Testavimo instrukcijos:</strong></p>
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>GA4: Google Analytics → Realtime → DebugView (reikia GA Debug extension)</li>
                <li>Meta CAPI: Events Manager → Test Events → Server Events</li>
                <li>Sitemap: <a href="/api/sitemap" target="_blank" className="underline">Dinaminis sitemap.xml</a></li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="profit">
            <ProfitMarginReport />
          </TabsContent>

          <TabsContent value="refunds">
            <RefundsManager />
          </TabsContent>

          <TabsContent value="giftcards">
            <GiftCardsManager />
          </TabsContent>

          <TabsContent value="newsletter">
            <NewsletterManager />
          </TabsContent>

          <TabsContent value="banners">
            <PromoBannersManager />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsManager />
          </TabsContent>

          <TabsContent value="inquiries">
            <InquiriesManager />
          </TabsContent>

          <TabsContent value="stock-notifications">
            <StockNotificationsManager />
          </TabsContent>

          <TabsContent value="credits">
            <CreditsManager />
          </TabsContent>

          <TabsContent value="emails">
            <EmailPreviewManager />
          </TabsContent>

          <TabsContent value="product-stats">
            <div className="space-y-8">
              <ProductStatsManager />
              <ActiveCartsManager />
            </div>
          </TabsContent>

          <TabsContent value="setup">
            <AdminSetup />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}