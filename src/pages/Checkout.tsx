import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";

// This page is no longer used - checkout happens through Shopify
// Keeping it as a redirect to the products page

export default function Checkout() {
  return (
    <PageLayout>
      <div className="container py-16 max-w-lg mx-auto text-center">
        <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold mb-2">
          Apmokėjimas vyksta per Shopify
        </h1>
        <p className="text-muted-foreground mb-6">
          Pridėkite prekes į krepšelį ir spauskite "Pereiti į apmokėjimą" - būsite nukreipti į saugų Shopify apmokėjimo puslapį.
        </p>
        <Button asChild>
          <Link to="/varikliai">Peržiūrėti variklius</Link>
        </Button>
      </div>
    </PageLayout>
  );
}
