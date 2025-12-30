import { useState } from "react";
import { Package, Truck, CheckCircle2, Box } from "lucide-react";
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
  { value: 'courier', label: 'Kurjeris' },
  { value: 'other', label: 'Kitas' },
];

export function ShipmentManager({ orderId, orderNumber, shipment, onUpdate }: ShipmentManagerProps) {
  const [loading, setLoading] = useState(false);
  const [carrier, setCarrier] = useState<CarrierCode>(shipment?.carrier_code || 'omniva');
  const [trackingNumber, setTrackingNumber] = useState(shipment?.tracking_number || '');

  const createShipment = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .insert({
          order_id: orderId,
          carrier_code: carrier,
          status: 'pending',
        });

      if (error) throw error;
      toast.success('Siunta sukurta');
      onUpdate();
    } catch (e: any) {
      toast.error('Klaida kuriant siuntą: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const markPacked = async () => {
    if (!shipment) return;
    setLoading(true);
    try {
      const { error: shipmentError } = await supabase
        .from('shipments')
        .update({ 
          status: 'packed',
          packed_at: new Date().toISOString(),
        })
        .eq('id', shipment.id);

      if (shipmentError) throw shipmentError;

      // Add event
      await supabase.from('shipment_events').insert({
        shipment_id: shipment.id,
        source: 'internal',
        status_code: 'packed',
        description: 'Užsakymas supakuotas',
        occurred_at: new Date().toISOString(),
      });

      toast.success('Pažymėta kaip supakuota');
      onUpdate();
    } catch (e: any) {
      toast.error('Klaida: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const markShipped = async () => {
    if (!shipment) return;
    if (!trackingNumber.trim()) {
      toast.error('Įveskite sekimo numerį');
      return;
    }
    
    setLoading(true);
    try {
      const { error: shipmentError } = await supabase
        .from('shipments')
        .update({ 
          status: 'shipped',
          shipped_at: new Date().toISOString(),
          tracking_number: trackingNumber.trim(),
          carrier_code: carrier,
        })
        .eq('id', shipment.id);

      if (shipmentError) throw shipmentError;

      // Add event
      await supabase.from('shipment_events').insert({
        shipment_id: shipment.id,
        source: 'internal',
        status_code: 'shipped',
        description: `Išsiųsta per ${CARRIERS.find(c => c.value === carrier)?.label}`,
        occurred_at: new Date().toISOString(),
      });

      toast.success('Pažymėta kaip išsiųsta');
      onUpdate();
    } catch (e: any) {
      toast.error('Klaida: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const markDelivered = async () => {
    if (!shipment) return;
    setLoading(true);
    try {
      const { error: shipmentError } = await supabase
        .from('shipments')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        .eq('id', shipment.id);

      if (shipmentError) throw shipmentError;

      // Add event
      await supabase.from('shipment_events').insert({
        shipment_id: shipment.id,
        source: 'internal',
        status_code: 'delivered',
        description: 'Pristatyta',
        occurred_at: new Date().toISOString(),
      });

      toast.success('Pažymėta kaip pristatyta');
      onUpdate();
    } catch (e: any) {
      toast.error('Klaida: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    const config: Record<ShipmentStatus, { label: string; className: string }> = {
      'pending': { label: 'Ruošiama', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
      'packed': { label: 'Supakuota', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
      'shipped': { label: 'Išsiųsta', className: 'bg-primary/10 text-primary border-primary/30' },
      'in_transit': { label: 'Kelyje', className: 'bg-primary/10 text-primary border-primary/30' },
      'out_for_delivery': { label: 'Pristatoma', className: 'bg-accent/10 text-accent border-accent/30' },
      'delivered': { label: 'Pristatyta', className: 'bg-success/10 text-success border-success/30' },
      'exception': { label: 'Nesklandumas', className: 'bg-destructive/10 text-destructive border-destructive/30' },
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
          Siunta
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sukurkite siuntą šiam užsakymui.
        </p>
        <div className="space-y-3">
          <div>
            <Label>Vežėjas</Label>
            <Select value={carrier} onValueChange={(v) => setCarrier(v as CarrierCode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={createShipment} disabled={loading} className="w-full">
            <Package className="w-4 h-4 mr-2" />
            Sukurti siuntą
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
          Siunta
        </h3>
        {getStatusBadge(shipment.status)}
      </div>

      <div className="space-y-4">
        {/* Carrier & Tracking */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Vežėjas</Label>
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
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sekimo numeris</Label>
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
              <Box className="w-4 h-4 mr-1" />
              Supakuota
            </Button>
          )}

          {(shipment.status === 'pending' || shipment.status === 'packed') && (
            <Button 
              onClick={markShipped} 
              disabled={loading || !trackingNumber.trim()}
              size="sm"
            >
              <Truck className="w-4 h-4 mr-1" />
              Išsiųsta
            </Button>
          )}

          {shipment.status === 'shipped' && (
            <Button 
              onClick={markDelivered} 
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-success/50 text-success hover:bg-success/10"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Pristatyta
            </Button>
          )}
        </div>

        {/* Timeline info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
          {shipment.packed_at && (
            <p>Supakuota: {new Date(shipment.packed_at).toLocaleString('lt-LT')}</p>
          )}
          {shipment.shipped_at && (
            <p>Išsiųsta: {new Date(shipment.shipped_at).toLocaleString('lt-LT')}</p>
          )}
          {shipment.delivered_at && (
            <p>Pristatyta: {new Date(shipment.delivered_at).toLocaleString('lt-LT')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
