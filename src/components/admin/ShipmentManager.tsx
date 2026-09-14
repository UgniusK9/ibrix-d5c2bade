import { useState } from "react";
import { Package, Truck, CheckCircle2, Box, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type CarrierCode = Database["public"]["Enums"]["carrier_code"];
type ShipmentStatus = Database["public"]["Enums"]["shipment_status"];

interface Shipment {
  id: string;
  carrier_code: CarrierCode;
  tracking_number: string | null;
  status: ShipmentStatus;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

interface ShipmentManagerProps {
  orderId: string;
  orderNumber: string;
  shipment: Shipment | null;
  onUpdate: () => void;
}

const CARRIERS: { value: CarrierCode; label: string }[] = [
  { value: 'omniva', label: 'Omniva' },
  { value: 'lp_express', label: 'LP EXPRESS' },
  { value: 'dpd', label: 'DPD' },
  { value: 'other', label: 'admShip.shipOther' },
];



export function ShipmentManager({ orderId, orderNumber, shipment, onUpdate }: ShipmentManagerProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const callAdminApi = async (action: string, data: Record<string, unknown> = {}) => {
    const { data: result, error } = await supabase.functions.invoke('admin', {
      body: { action, ...data },
    });
    if (error) throw new Error(error.message);
    if (!result?.success) throw new Error(result?.error || t('admCredits.giftUnknownError'));
    return result;
  };
  const [carrier, setCarrier] = useState<CarrierCode>(shipment?.carrier_code || 'omniva');
  const [trackingNumber, setTrackingNumber] = useState(shipment?.tracking_number || '');

  const createShipment = async () => {
    setLoading(true);
    try {
      await callAdminApi('create_shipment', { orderId, carrierCode: carrier });
      toast.success(t('admShip.shipCreated'));
      onUpdate();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('admCredits.giftUnknownError');
      toast.error(t('admShip.shipCreateError', { msg }));
    } finally {
      setLoading(false);
    }
  };

  const markPacked = async () => {
    if (!shipment) return;
    setLoading(true);
    try {
      await callAdminApi('mark_packed', { shipmentId: shipment.id });
      toast.success(t('admShip.shipPackedDone'));
      onUpdate();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('admCredits.giftUnknownError');
      toast.error(t('admCommon.errorMsg', { msg }));
    } finally {
      setLoading(false);
    }
  };

  const markShipped = async () => {
    if (!shipment) return;
    if (!trackingNumber.trim()) {
      toast.error(t('admShip.shipEnterTracking'));
      return;
    }
    
    setLoading(true);
    try {
      await callAdminApi('mark_shipped', { 
        shipmentId: shipment.id, 
        trackingNumber: trackingNumber.trim(),
        carrierCode: carrier,
      });
      toast.success(t('admShip.shipShippedDone'));
      onUpdate();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('admCredits.giftUnknownError');
      toast.error(t('admCommon.errorMsg', { msg }));
    } finally {
      setLoading(false);
    }
  };

  const markDelivered = async () => {
    if (!shipment) return;
    setLoading(true);
    try {
      await callAdminApi('mark_delivered', { shipmentId: shipment.id });
      toast.success(t('admShip.shipDeliveredDone'));
      onUpdate();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('admCredits.giftUnknownError');
      toast.error(t('admCommon.errorMsg', { msg }));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    const config: Record<ShipmentStatus, { label: string; className: string }> = {
      'pending': { label: t('admShip.shipPreparing'), className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
      'packed': { label: t('admOrders.ordPacked'), className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
      'shipped': { label: t('admOrders.ordShipped'), className: 'bg-primary/10 text-primary border-primary/30' },
      'in_transit': { label: t('admShip.shipInTransit'), className: 'bg-primary/10 text-primary border-primary/30' },
      'delivered': { label: t('admOrders.ordDelivered'), className: 'bg-green-500/10 text-green-600 border-green-500/30' },
    };
    return (
      <Badge variant="outline" className={config[status].className}>
        {config[status].label}
      </Badge>
    );
  };

  // No shipment yet - create one
  if (!shipment) {
    return (
      <div className="bg-muted/30 rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" />
          {t("admShip.shipTitle")}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("admShip.shipCreateHint")}
        </p>
        <div className="space-y-3">
          <div>
            <Label>{t("admShip.shipCarrier")}</Label>
            <Select value={carrier} onValueChange={(v) => setCarrier(v as CarrierCode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label.startsWith('admShip.') ? t(c.label) : c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={createShipment} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
            {t("admShip.shipCreate")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Truck className="w-4 h-4" />
          {t("admShip.shipTitle")}
        </h3>
        {getStatusBadge(shipment.status)}
      </div>

      <div className="space-y-4">
        {/* Carrier & Tracking */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("admShip.shipCarrier")}</Label>
            <Select 
              value={carrier} 
              onValueChange={(v) => setCarrier(v as CarrierCode)}
              disabled={shipment.status === 'delivered'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label.startsWith('admShip.') ? t(c.label) : c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("admShip.shipTracking")}</Label>
            <Input 
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="ABC123456789"
              disabled={shipment.status === 'delivered'}
            />
          </div>
        </div>

        {/* Action buttons based on status */}
        <div className="flex flex-wrap gap-2">
          {shipment.status === 'pending' && (
            <Button 
              onClick={markPacked} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Box className="w-4 h-4 mr-1" />}
              {t("admOrders.ordPacked")}
            </Button>
          )}

          {(shipment.status === 'pending' || shipment.status === 'packed') && (
            <Button 
              onClick={markShipped} 
              disabled={loading || !trackingNumber.trim()}
              size="sm"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Truck className="w-4 h-4 mr-1" />}
              {t("admOrders.ordShipped")}
            </Button>
          )}

          {shipment.status === 'shipped' && (
            <Button 
              onClick={markDelivered} 
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-green-500/50 text-green-600 hover:bg-green-500/10"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
              {t("admOrders.ordDelivered")}
            </Button>
          )}
        </div>

        {/* Timeline info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
          {shipment.packed_at && (
            <p>{t('admShip.shipPackedAt', { date: new Date(shipment.packed_at).toLocaleString('lt-LT') })}</p>
          )}
          {shipment.shipped_at && (
            <p>{t('admShip.shipShippedAt', { date: new Date(shipment.shipped_at).toLocaleString('lt-LT') })}</p>
          )}
          {shipment.delivered_at && (
            <p>{t('admShip.shipDeliveredAt', { date: new Date(shipment.delivered_at).toLocaleString('lt-LT') })}</p>
          )}
        </div>
      </div>
    </div>
  );
}
