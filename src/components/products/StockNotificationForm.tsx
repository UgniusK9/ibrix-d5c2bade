import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface StockNotificationFormProps {
  productId: string;
}

export function StockNotificationForm({ productId }: StockNotificationFormProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Įveskite el. pašto adresą");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stock_notifications')
        .insert({
          product_id: productId,
          email: email,
          user_id: user?.id || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast.info("Jau prenumeruojate šio produkto pranešimus");
          setSubscribed(true);
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
        toast.success("Pranešimas užregistruotas", {
          description: "Informuosime, kai produktas bus sandėlyje",
        });
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error("Nepavyko užsiregistruoti pranešimui");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-success bg-success/10 rounded-lg p-3">
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">Pranešimas užregistruotas</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="space-y-2">
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Bell className="w-4 h-4" />
        Gauti pranešimą, kai bus sandėlyje
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="jusu@email.lt"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Pranešti"
          )}
        </Button>
      </div>
    </form>
  );
}
