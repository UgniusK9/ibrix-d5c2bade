import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/checkout/PhoneInput";

export type ManualCarrier = "dpd" | "omniva" | "lp_express" | "venipak";

export interface ManualLockerData {
  carrier: ManualCarrier | "";
  address: string;
  postalCode: string;
  phone: string;
}

interface ManualLockerInputProps {
  value: ManualLockerData;
  onChange: (value: ManualLockerData) => void;
}

const CARRIER_OPTIONS: { value: ManualCarrier; label: string }[] = [
  { value: "dpd", label: "DPD paštomatas" },
  { value: "omniva", label: "Omniva paštomatas" },
  { value: "lp_express", label: "LP EXPRESS paštomatas" },
  { value: "venipak", label: "Venipak paštomatas" },
];

export function ManualLockerInput({ value, onChange }: ManualLockerInputProps) {
  const update = (patch: Partial<ManualLockerData>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-primary" />
          Pristatymo paslaugos teikėjas *
        </Label>
        <Select
          value={value.carrier || undefined}
          onValueChange={(v) => update({ carrier: v as ManualCarrier })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pasirinkite tiekėją" />
          </SelectTrigger>
          <SelectContent>
            {CARRIER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="locker-address">Paštomato adresas *</Label>
        <Input
          id="locker-address"
          value={value.address}
          onChange={(e) => update({ address: e.target.value })}
          placeholder="Pvz. Ozo g. 25, Vilnius"
        />
      </div>

      <div>
        <Label htmlFor="locker-postal">Pašto kodas *</Label>
        <Input
          id="locker-postal"
          value={value.postalCode}
          onChange={(e) => update({ postalCode: e.target.value })}
          placeholder="Pvz. LT-07150"
        />
      </div>

      <div>
        <Label className="mb-2 block">Telefono numeris *</Label>
        <PhoneInput
          value={value.phone}
          onChange={(v) => update({ phone: v })}
        />
      </div>
    </div>
  );
}
