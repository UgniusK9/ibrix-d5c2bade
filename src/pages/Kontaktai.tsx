import { useState } from "react";
import { Mail, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
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
import { useTranslation } from "react-i18next";

export default function Kontaktai() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");

  const contactInfo = [
    {
      icon: Mail,
      title: t("contact.email"),
      value: "support@ibrix.lt",
      href: "mailto:support@ibrix.lt",
    },
    {
      icon: MapPin,
      title: t("contact.city"),
      value: t("footer.address"),
      href: null,
    },
    {
      icon: Clock,
      title: t("contact.workingHours"),
      value: t("contact.workingHoursValue"),
      href: null,
    },
  ];

  const topics = [
    { value: "uzsakymas", label: t("contact.topicOrder") },
    { value: "preorder", label: t("contact.topicPreorder") },
    { value: "trukstamos", label: t("contact.topicMissing") },
    { value: "grazinimai", label: t("contact.topicReturns") },
    { value: "kita", label: t("contact.topicOther") },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const order = formData.get("order") as string;
    const message = formData.get("message") as string;

    try {
      // Validate that topic is selected
      if (!selectedTopic) {
        toast.error(t("contact.formTopicPlaceholder"));
        setLoading(false);
        return;
      }

      const { data: inquiryData, error } = await supabase.from("contact_inquiries").insert({
        name,
        email,
        topic: selectedTopic,
        order_number: order || null,
        message,
      }).select().single();

      if (error) {
        console.error("Database insert error:", error);
        throw new Error(error.message || t("pgContactPg.saveFailed"));
      }

      // Send auto-reply email (don't fail the whole submission if email fails)
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'inquiry_received',
            email,
            data: {
              email,
              firstName: name,
              topic: topics.find((top) => top.value === selectedTopic)?.label || selectedTopic,
              message,
              orderNumber: order || null,
              conversationToken: inquiryData?.conversation_token,
            },
          },
        });
      } catch (emailError) {
        console.warn("Email notification failed:", emailError);
        // Don't throw - the inquiry was saved successfully
      }

      setSubmitted(true);
      toast.success(t("contact.messageSent"), {
        description: t("contact.messageSentDesc"),
        position: "top-center",
      });
    } catch (error: any) {
      console.error("Error submitting inquiry:", error);
      toast.error(t("pgContactPg.sendErrorTitle"), {
        description: error.message || t("pgContactPg.retryLater"),
      });
    }

    setLoading(false);
  };

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
                {t("contact.title")}
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                {t("contact.subtitle")}
              </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-12">
              {/* Contact Info */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="font-heading text-xl font-semibold mb-4">
                  {t("contact.contactInfo")}
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
                    {t("contact.responseNote")}
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
                        {t("contact.messageSent")}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {t("contact.thankYou")}
                      </p>
                      <Button variant="outline" onClick={() => setSubmitted(false)}>
                        {t("contact.sendAnother")}
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t("contact.formName")}</Label>
                          <Input 
                            id="name" 
                            name="name"
                            placeholder={t("contact.formNamePlaceholder")} 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t("contact.formEmail")}</Label>
                          <Input 
                            id="email" 
                            name="email"
                            type="email" 
                            placeholder={t("contact.formEmailPlaceholder")} 
                            required 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="topic">{t("contact.formTopic")}</Label>
                        <Select name="topic" required value={selectedTopic} onValueChange={setSelectedTopic}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("contact.formTopicPlaceholder")} />
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
                        <Label htmlFor="order">{t("contact.formOrderNumber")}</Label>
                        <Input 
                          id="order" 
                          name="order"
                          placeholder={t("contact.formOrderNumberPlaceholder")} 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">{t("contact.formMessage")}</Label>
                        <Textarea 
                          id="message" 
                          name="message"
                          placeholder={t("contact.formMessagePlaceholder")} 
                          rows={5}
                          required 
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                          t("common.sending")
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            {t("contact.sendMessage")}
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
