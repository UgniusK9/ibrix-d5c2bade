import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, MessageSquare, Clock, User, Building2 } from "lucide-react";
import { format } from "date-fns";
import { lt } from "date-fns/locale";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  topic: string;
  order_number: string | null;
  message: string;
  status: string;
  conversation_token: string;
  created_at: string;
}

interface InquiryMessage {
  id: string;
  inquiry_id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

const topicLabels: Record<string, string> = {
  uzsakymas: "Klausimas apie užsakymą",
  preorder: "Pre-order informacija",
  trukstamos: "Trūkstamos detalės",
  grazinimai: "Grąžinimai ir keitimai",
  kita: "Kita",
};

export default function Pokalbis() {
  const { token } = useParams<{ token: string }>();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Fetch inquiry
    const { data: inquiryData, error: inquiryError } = await supabase
      .from("contact_inquiries")
      .select("*")
      .eq("conversation_token", token)
      .single();

    if (inquiryError || !inquiryData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setInquiry(inquiryData);

    // Fetch messages
    const { data: messagesData } = await supabase
      .from("inquiry_messages")
      .select("*")
      .eq("inquiry_id", inquiryData.id)
      .order("created_at", { ascending: true });

    setMessages(messagesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Realtime subscription for new messages and typing indicator
  useEffect(() => {
    if (!inquiry) return;

    // Database changes channel for new messages
    const messagesChannel = supabase
      .channel(`conversation-${inquiry.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'inquiry_messages',
          filter: `inquiry_id=eq.${inquiry.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as InquiryMessage]);
          setAdminTyping(false);
        }
      )
      .subscribe();

    // Presence channel for typing indicator
    const presenceChannel = supabase
      .channel(`typing-${inquiry.id}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const adminIsTyping = Object.values(state).some((presences: any) =>
          presences.some((p: any) => p.role === 'admin' && p.typing)
        );
        setAdminTyping(adminIsTyping);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [inquiry?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inquiry || !newMessage.trim()) return;

    setSending(true);

    try {
      const messageText = newMessage.trim();
      
      const { error } = await supabase
        .from("inquiry_messages")
        .insert({
          inquiry_id: inquiry.id,
          sender_type: "customer",
          message: messageText,
        });

      if (error) throw error;

      // Update inquiry status back to in_progress
      await supabase
        .from("contact_inquiries")
        .update({ status: "in_progress" })
        .eq("id", inquiry.id);

      // Send email notification to admin
      await supabase.functions.invoke("send-email", {
        body: {
          type: "admin_inquiry_notification",
          customerName: inquiry.name,
          customerEmail: inquiry.email,
          topic: topicLabels[inquiry.topic] || inquiry.topic,
          message: messageText,
          conversationUrl: `${window.location.origin}/admin`,
        },
      });

      toast.success("Žinutė išsiųsta!");
      setNewMessage("");
      await fetchData();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Nepavyko išsiųsti žinutės");
    }

    setSending(false);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (notFound) {
    return (
      <PageLayout>
        <div className="container py-16">
          <div className="max-w-2xl mx-auto text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="font-heading text-2xl font-bold mb-2">Pokalbis nerastas</h1>
            <p className="text-muted-foreground">
              Šis pokalbio nuoroda negalioja arba pokalbis buvo ištrintas.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-bold mb-2">Jūsų užklausa</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{topicLabels[inquiry!.topic] || inquiry!.topic}</span>
              {inquiry!.order_number && (
                <span className="font-mono">{inquiry!.order_number}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(inquiry!.created_at), "yyyy-MM-dd", { locale: lt })}
              </span>
            </div>
          </div>

          {/* Original Message */}
          <Card className="p-4 mb-6 bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{inquiry!.name}</span>
              <span>·</span>
              <span>{format(new Date(inquiry!.created_at), "MMM d, HH:mm", { locale: lt })}</span>
            </div>
            <p className="whitespace-pre-wrap">{inquiry!.message}</p>
          </Card>

          {/* Messages */}
          {messages.length > 0 && (
            <div className="space-y-4 mb-6">
              {messages.map(msg => (
                <Card
                  key={msg.id}
                  className={`p-4 ${
                    msg.sender_type === "admin"
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    {msg.sender_type === "admin" ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="font-medium">
                      {msg.sender_type === "admin" ? "IBRIX" : inquiry!.name}
                    </span>
                    <span>·</span>
                    <span>{format(new Date(msg.created_at), "MMM d, HH:mm", { locale: lt })}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </Card>
              ))}
              {adminTyping && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse pl-4">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>IBRIX rašo...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Reply Form */}
          <Card className="p-4">
            <h3 className="font-medium mb-3">Tęsti pokalbį</h3>
            <Textarea
              placeholder="Rašykite žinutę..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
              className="mb-3"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="w-full sm:w-auto"
            >
              {sending ? (
                "Siunčiama..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Siųsti žinutę
                </>
              )}
            </Button>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Išsaugokite šią nuorodą, jei norėsite grįžti prie pokalbio vėliau.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
