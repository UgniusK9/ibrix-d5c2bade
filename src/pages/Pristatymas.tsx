import { PageLayout } from "@/components/layout/PageLayout";
import { Truck, Clock, MapPin } from "lucide-react";

export default function Pristatymas() {
  return (
    <PageLayout>
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-8">Pristatymas</h1>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">Nemokamas pristatymas</h2>
              </div>
              <p className="text-muted-foreground m-0">
                Visus užsakymus pristatome nemokamai į bet kurį paštomatą Lietuvoje – Omniva, LP Express arba DPD.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">Pristatymo terminai</h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2">
                <li><strong>Sandėlyje esantys produktai:</strong> 1–2 darbo dienos</li>
                <li><strong>Pre-order produktai:</strong> 8–10 savaičių nuo užsakymo</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-semibold m-0">Pristatymo būdai</h2>
              </div>
              <ul className="text-muted-foreground m-0 space-y-2">
                <li>Omniva paštomatai</li>
                <li>LP Express paštomatai</li>
                <li>DPD paštomatai</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
