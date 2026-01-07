import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, MessageSquare, Send, RefreshCw, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { lt } from "date-fns/locale";
import { useNotificationSound } from "@/hooks/useNotificationSound";

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
  updated_at: string;
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

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "Naujas", variant: "destructive" },
  in_progress: { label: "Vykdomas", variant: "default" },
  resolved: { label: "Išspręstas", variant: "secondary" },
};

export function InquiriesManager() {
  const { play } = useNotificationSound();

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [deleteInquiry, setDeleteInquiry] = useState<Inquiry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching inquiries:", error);
      toast.error("Nepavyko gauti užklausų");
    } else {
      setInquiries(data || []);
    }
    setLoading(false);
  };

  const fetchMessages = async (inquiryId: string) => {
    const { data, error } = await supabase
      .from("inquiry_messages")
      .select("*")
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
  };

  useEffect(() => {
    fetchInquiries();

    // Realtime subscription for new inquiries and messages
    const inquiriesChannel = supabase
      .channel('admin-inquiries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_inquiries' },
          (payload) => {
            console.log('Inquiry change:', payload);
            if (payload.eventType === 'INSERT') {
              setInquiries(prev => [payload.new as Inquiry, ...prev]);
              play({ frequency: 784, durationMs: 160 });
              toast.info("Nauja užklausa!", { description: (payload.new as Inquiry).name });
            } else if (payload.eventType === 'UPDATE') {
              setInquiries(prev => 
                prev.map(i => i.id === (payload.new as Inquiry).id ? payload.new as Inquiry : i)
              );
            } else if (payload.eventType === 'DELETE') {
              setInquiries(prev => prev.filter(i => i.id !== (payload.old as Inquiry).id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'inquiry_messages' },
          (payload) => {
            const newMessage = payload.new as InquiryMessage;
            if (newMessage.sender_type === 'customer') {
              play({ frequency: 988, durationMs: 140 });
              toast.info("Naujas kliento atsakymas!", {
                description: "Klientas atsakė į užklausą",
                action: {
                  label: "Peržiūrėti",
                  onClick: () => {
                    const inquiry = inquiries.find(i => i.id === newMessage.inquiry_id);
                    if (inquiry) handleOpenInquiry(inquiry);
                  }
                }
              });
              if (selectedInquiry?.id === newMessage.inquiry_id) {
                fetchMessages(newMessage.inquiry_id);
              }
            }
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(inquiriesChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedInquiry) {
      fetchMessages(selectedInquiry.id);
    }
  }, [selectedInquiry]);

  const handleOpenInquiry = async (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    
    // Mark as in progress if new
    if (inquiry.status === "new") {
      await supabase
        .from("contact_inquiries")
        .update({ status: "in_progress" })
        .eq("id", inquiry.id);
      
      setInquiries(prev => 
        prev.map(i => i.id === inquiry.id ? { ...i, status: "in_progress" } : i)
      );
    }
  };

  const handleSendReply = async () => {
    if (!selectedInquiry || !replyMessage.trim()) return;

    setSendingReply(true);

    try {
      // Save message to database
      const { error: msgError } = await supabase
        .from("inquiry_messages")
        .insert({
          inquiry_id: selectedInquiry.id,
          sender_type: "admin",
          message: replyMessage.trim(),
        });

      if (msgError) throw msgError;

      // Send email to customer
      const conversationUrl = `${window.location.origin}/pokalbis/${selectedInquiry.conversation_token}`;
      
      const { error: emailError } = await supabase.functions.invoke("send-email", {
        body: {
          type: "inquiry_reply",
          to: selectedInquiry.email,
          customerName: selectedInquiry.name,
          replyMessage: replyMessage.trim(),
          conversationUrl,
          originalTopic: topicLabels[selectedInquiry.topic] || selectedInquiry.topic,
        },
      });

      if (emailError) {
        console.error("Email error:", emailError);
        toast.warning("Žinutė išsaugota, bet el. laiškas neišsiųstas");
      } else {
        toast.success("Atsakymas išsiųstas!");
      }

      // Refresh messages
      await fetchMessages(selectedInquiry.id);
      setReplyMessage("");

      // Update status to resolved
      await supabase
        .from("contact_inquiries")
        .update({ status: "resolved" })
        .eq("id", selectedInquiry.id);

      setInquiries(prev =>
        prev.map(i => i.id === selectedInquiry.id ? { ...i, status: "resolved" } : i)
      );

    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Nepavyko išsiųsti atsakymo");
    }

    setSendingReply(false);
  };

  const handleDelete = async () => {
    if (!deleteInquiry) return;

    setDeleting(true);

    const { error } = await supabase
      .from("contact_inquiries")
      .delete()
      .eq("id", deleteInquiry.id);

    if (error) {
      console.error("Error deleting inquiry:", error);
      toast.error("Nepavyko ištrinti");
    } else {
      toast.success("Užklausa ištrinta");
      setInquiries(prev => prev.filter(i => i.id !== deleteInquiry.id));
    }

    setDeleting(false);
    setDeleteInquiry(null);
  };

  const newCount = inquiries.filter(i => i.status === "new").length;
  const inProgressCount = inquiries.filter(i => i.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Užklausos</h2>
          <p className="text-sm text-muted-foreground">
            {newCount > 0 && <span className="text-destructive font-medium">{newCount} naujos</span>}
            {newCount > 0 && inProgressCount > 0 && " · "}
            {inProgressCount > 0 && <span>{inProgressCount} vykdomos</span>}
            {newCount === 0 && inProgressCount === 0 && "Visos užklausos išspręstos"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInquiries} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atnaujinti
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nėra užklausų</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map(inquiry => (
            <Card
              key={inquiry.id}
              className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                inquiry.status === "new" ? "border-destructive/50 bg-destructive/5" : ""
              }`}
              onClick={() => handleOpenInquiry(inquiry)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{inquiry.name}</span>
                    <Badge variant={statusLabels[inquiry.status]?.variant || "outline"}>
                      {statusLabels[inquiry.status]?.label || inquiry.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{inquiry.email}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{topicLabels[inquiry.topic] || inquiry.topic}</span>
                    {inquiry.order_number && (
                      <span className="font-mono">{inquiry.order_number}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(inquiry.created_at), "MMM d, HH:mm", { locale: lt })}
                    </span>
                  </div>
                  <p className="text-sm mt-2 line-clamp-2">{inquiry.message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteInquiry(inquiry);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Inquiry Detail Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedInquiry?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedInquiry && (
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">El. paštas</Label>
                  <p className="font-medium">{selectedInquiry.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tema</Label>
                  <p className="font-medium">{topicLabels[selectedInquiry.topic] || selectedInquiry.topic}</p>
                </div>
                {selectedInquiry.order_number && (
                  <div>
                    <Label className="text-muted-foreground">Užsakymo nr.</Label>
                    <p className="font-mono font-medium">{selectedInquiry.order_number}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p className="font-medium">
                    {format(new Date(selectedInquiry.created_at), "yyyy-MM-dd HH:mm", { locale: lt })}
                  </p>
                </div>
              </div>

              {/* Original Message */}
              <div className="bg-muted/50 rounded-lg p-4">
                <Label className="text-muted-foreground text-xs mb-1 block">Originali žinutė</Label>
                <p className="whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>

              {/* Conversation */}
              {messages.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-muted-foreground">Pokalbio istorija</Label>
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.sender_type === "admin"
                          ? "bg-primary/10 ml-8"
                          : "bg-muted mr-8"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span className="font-medium">
                          {msg.sender_type === "admin" ? "Jūs" : selectedInquiry.name}
                        </span>
                        <span>{format(new Date(msg.created_at), "MMM d, HH:mm", { locale: lt })}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              <div className="space-y-2">
                <Label>Atsakyti</Label>
                <Textarea
                  placeholder="Rašykite atsakymą..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInquiry(null)}>
              Uždaryti
            </Button>
            <Button onClick={handleSendReply} disabled={!replyMessage.trim() || sendingReply}>
              {sendingReply ? (
                "Siunčiama..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Siųsti atsakymą
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteInquiry} onOpenChange={() => setDeleteInquiry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ištrinti užklausą?</AlertDialogTitle>
            <AlertDialogDescription>
              Ši užklausa ir visa pokalbio istorija bus ištrinta negrįžtamai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Atšaukti</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Trinama..." : "Ištrinti"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
