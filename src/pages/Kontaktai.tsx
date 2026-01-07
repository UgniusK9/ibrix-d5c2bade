import { useState } from "react";
import { Mail, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const contactInfo = [
  {
    icon: Mail,
    title: "El. paštas",
    value: "support@ibrix.lt",
    href: "mailto:support@ibrix.lt",
  },
  {
    icon: MapPin,
    title: "Miestas",
    value: "Vilnius, Lietuva",
    href: null,
  },
  {
    icon: Clock,
    title: "Darbo laikas",
    value: "I-V 10:00-18:00",
    href: null,
  },
];

const topics = [
  { value: "uzsakymas", label: "Klausimas apie užsakymą" },
  { value: "preorder", label: "Pre-order informacija" },
  { value: "trukstamos", label: "Trūkstamos detalės" },
  { value: "grazinimai", label: "Grąžinimai ir keitimai" },
  { value: "kita", label: "Kita" },
];

export default function Kontaktai() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const order = formData.get("order") as string;
    const message = formData.get("message") as string;

    try {
      const { data: inquiryData, error } = await supabase.from("contact_inquiries").insert({
        name,
        email,
        topic: selectedTopic,
        order_number: order || null,
        message,
      }).select().single();

      if (error) throw error;

      // Send auto-reply email
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'inquiry_received',
          data: {
            email,
            firstName: name,
            topic: topics.find(t => t.value === selectedTopic)?.label || selectedTopic,
            message,
            orderNumber: order || null,
            conversationToken: inquiryData?.conversation_token,
          },
        },
      });

      setSubmitted(true);
      toast.success("Žinutė išsiųsta!", {
        description: "Atsakysime per 24 valandas",
        position: "top-center",
      });
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error("Klaida siunčiant žinutę", {
        description: "Bandykite dar kartą vėliau",
      });
    }

    setLoading(false);
  };

  return (
    <PageLayout>
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
                Kontaktai
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Turite klausimų? Susisiekite su mumis – paprastai atsakome per 24 valandas
              </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-12">
              {/* Contact Info */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="font-heading text-xl font-semibold mb-4">
                  Kontaktinė informacija
                </h2>
                
                {contactInfo.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      {item.href ? (
                        <a 
                          href={item.href} 
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-medium">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Atsakome į visus klausimus lietuviškai. Vidutinis atsakymo laikas – 
                    iki 24 valandų darbo dienomis.
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-3">
                <div className="bg-card border border-border rounded-2xl p-8">
                  {submitted ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-success" />
                      </div>
                      <h3 className="font-heading text-xl font-semibold mb-2">
                        Žinutė išsiųsta!
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Dėkojame už jūsų žinutę. Atsakysime kuo greičiau.
                      </p>
                      <Button variant="outline" onClick={() => setSubmitted(false)}>
                        Siųsti dar vieną žinutę
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Vardas</Label>
                          <Input 
                            id="name" 
                            name="name"
                            placeholder="Jūsų vardas" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">El. paštas</Label>
                          <Input 
                            id="email" 
                            name="email"
                            type="email" 
                            placeholder="jusu@email.lt" 
                            required 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="topic">Tema</Label>
                        <Select name="topic" required value={selectedTopic} onValueChange={setSelectedTopic}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pasirinkite temą" />
                          </SelectTrigger>
                          <SelectContent>
                            {topics.map((topic) => (
                              <SelectItem key={topic.value} value={topic.value}>
                                {topic.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="order">Užsakymo nr. (nebūtina)</Label>
                        <Input 
                          id="order" 
                          name="order"
                          placeholder="Pvz. #12345" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Žinutė</Label>
                        <Textarea 
                          id="message" 
                          name="message"
                          placeholder="Kaip galime padėti?" 
                          rows={5}
                          required 
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                          "Siunčiama..."
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Siųsti žinutę
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
