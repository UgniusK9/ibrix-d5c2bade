import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingCart, Send, Loader2, RefreshCw, User, UserX } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { lt } from "date-fns/locale";

interface ActiveCart {
  cart_id: string;
  user_id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  item_count: number;
  total_qty: number;
  cart_value_eur: number;
  updated_at: string;
}

export function ActiveCartsManager() {
  const [carts, setCarts] = useState<ActiveCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCart, setSelectedCart] = useState<ActiveCart | null>(null);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [customMessage, setCustomMessage] = useState("");
  const [overrideEmail, setOverrideEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadCarts();
  }, []);

  const loadCarts = async () => {
    setRefreshing(true);
    try {
      // Pull carts with their items + product prices + user info
      const { data: cartItems, error } = await supabase
        .from("cart_items")
        .select(`
          quantity,
          updated_at,
          cart_id,
          carts!inner(id, user_id, anonymous_id, updated_at, users(email, first_name, last_name)),
          products(price_eur, sale_price_eur)
        `);

      if (error) throw error;

      const map = new Map<string, ActiveCart>();
      (cartItems || []).forEach((row: any) => {
        const cart = row.carts;
        const product = row.products;
        if (!cart) return;

        const userInfo = cart.users;
        const price = product?.sale_price_eur ?? product?.price_eur ?? 0;
        const lineTotal = price * row.quantity;

        const existing = map.get(cart.id);
        if (existing) {
          existing.item_count += 1;
          existing.total_qty += row.quantity;
          existing.cart_value_eur += lineTotal;
          if (new Date(row.updated_at) > new Date(existing.updated_at)) {
            existing.updated_at = row.updated_at;
          }
        } else {
          map.set(cart.id, {
            cart_id: cart.id,
            user_id: cart.user_id,
            email: userInfo?.email || null,
            first_name: userInfo?.first_name || null,
            last_name: userInfo?.last_name || null,
            item_count: 1,
            total_qty: row.quantity,
            cart_value_eur: lineTotal,
            updated_at: row.updated_at || cart.updated_at,
          });
        }
      });

      const list = Array.from(map.values()).sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setCarts(list);
    } catch (e: any) {
      console.error(e);
      toast.error("Klaida kraunant krepšelius: " + e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openSendModal = (cart: ActiveCart) => {
    setSelectedCart(cart);
    setOverrideEmail(cart.email || "");
    setDiscountType("percent");
    setDiscountValue(10);
    setCustomMessage("");
  };

  const handleSendRecovery = async () => {
    if (!selectedCart) return;
    const email = overrideEmail.trim() || selectedCart.email;
    if (!email) {
      toast.error("Įveskite pirkėjo el. paštą");
      return;
    }
    if (!discountValue || discountValue <= 0) {
      toast.error("Įveskite teisingą nuolaidos vertę");
      return;
    }
    if (discountType === "percent" && (discountValue < 1 || discountValue > 90)) {
      toast.error("Procentas turi būti tarp 1 ir 90");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-cart-recovery", {
        body: {
          cart_id: selectedCart.cart_id,
          recipient_email: email,
          recipient_name: selectedCart.first_name,
          user_id: selectedCart.user_id,
          discount_type: discountType,
          discount_value: discountValue,
          custom_message: customMessage.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.email_status === "sent") {
        toast.success(`El. laiškas išsiųstas: ${email} (kodas: ${data.offer_code})`);
      } else {
        toast.warning(`Nuolaida sukurta (${data?.offer_code}), bet el. laiško siuntimas nepavyko: ${data?.email_error || ""}`);
      }
      setSelectedCart(null);
    } catch (e: any) {
      console.error(e);
      toast.error("Klaida: " + e.message);
    } finally {
      setSending(false);
    }
  };

  const formatTimeInCart = (updatedAt: string) => {
    try {
      return formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: lt });
    } catch {
      return "—";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Aktyvūs krepšeliai
              <Badge variant="secondary">{carts.length}</Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadCarts} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Atnaujinti
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : carts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Šiuo metu aktyvių krepšelių nėra</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pirkėjas</TableHead>
                  <TableHead className="text-center">Prekės</TableHead>
                  <TableHead className="text-right">Vertė</TableHead>
                  <TableHead>Paskutinis veiksmas</TableHead>
                  <TableHead className="text-right">Veiksmai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carts.map((c) => (
                  <TableRow key={c.cart_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {c.user_id ? (
                          <User className="w-4 h-4 text-primary" />
                        ) : (
                          <UserX className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {c.first_name || c.last_name
                              ? `${c.first_name || ""} ${c.last_name || ""}`.trim()
                              : c.email || "Svečias"}
                          </p>
                          {c.email && (
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          )}
                          {!c.email && !c.user_id && (
                            <p className="text-xs text-muted-foreground italic">Nėra el. pašto</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{c.total_qty} vnt.</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {c.cart_value_eur.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimeInCart(c.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => openSendModal(c)}
                        disabled={!c.email && !c.user_id}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Paskatinti nusipirkti
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCart} onOpenChange={(o) => !o && setSelectedCart(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Siųsti nuolaidą</DialogTitle>
            <DialogDescription>
              Sukurkite asmeninį pasiūlymą šiam pirkėjui. Bus išsiųstas el. laiškas su unikaliu linku, kuris automatiškai pritaikys nuolaidą prisijungus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="recovery-email">Pirkėjo el. paštas</Label>
              <Input
                id="recovery-email"
                type="email"
                value={overrideEmail}
                onChange={(e) => setOverrideEmail(e.target.value)}
                placeholder="vardas@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Nuolaidos tipas</Label>
              <RadioGroup value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="percent" id="r-percent" />
                  <Label htmlFor="r-percent" className="cursor-pointer">Procentas (%)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="fixed" id="r-fixed" />
                  <Label htmlFor="r-fixed" className="cursor-pointer">Fiksuota suma (€)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-value">
                Vertė {discountType === "percent" ? "(%)" : "(€)"}
              </Label>
              <Input
                id="discount-value"
                type="number"
                min={1}
                max={discountType === "percent" ? 90 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-msg">Asmeninė žinutė (nebūtina)</Label>
              <Textarea
                id="custom-msg"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Pvz., specialiai jums – nepraleiskite progos!"
                rows={3}
                maxLength={300}
              />
            </div>

            {selectedCart && (
              <div className="rounded-xl bg-muted/50 p-3 text-sm">
                <p className="text-muted-foreground">Krepšelio vertė:</p>
                <p className="font-mono font-semibold">{selectedCart.cart_value_eur.toFixed(2)} €</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCart(null)} disabled={sending}>
              Atšaukti
            </Button>
            <Button onClick={handleSendRecovery} disabled={sending}>
              {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />
              Siųsti pasiūlymą
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
