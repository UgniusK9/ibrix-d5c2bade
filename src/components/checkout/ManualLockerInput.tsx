import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
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

export type ManualCarrier = "dpd" | "omniva" | "lp_express";

export interface ManualLockerData {
  carrier: ManualCarrier | "";
  address: string;
  postalCode: string;
  phone: string;
}

interface ManualLockerInputProps {
  value: ManualLockerData;
  onChange: (value: ManualLockerData) => void;
  fixedCarrier?: ManualCarrier;
}

const CARRIER_OPTIONS: { value: ManualCarrier; brand: string }[] = [
  { value: "omniva", brand: "Omniva" },
  { value: "lp_express", brand: "LP EXPRESS" },
  { value: "dpd", brand: "DPD" },
];

export function ManualLockerInput({ value, onChange, fixedCarrier }: ManualLockerInputProps) {
  const { t } = useTranslation();
  const update = (patch: Partial<ManualLockerData>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      {!fixedCarrier && (
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-primary" />
          {t('coLocker.provider')} *
        </Label>
        <Select
          value={value.carrier || undefined}
          onValueChange={(v) => update({ carrier: v as ManualCarrier })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('coLocker.providerPh')} />
          </SelectTrigger>
          <SelectContent>
            {CARRIER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t('coLocker.carrierLocker', { carrier: opt.brand })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      )}

      <div>
        <Label htmlFor="locker-address">{t('coLocker.address')} *</Label>
        <Input
          id="locker-address"
          value={value.address}
          onChange={(e) => update({ address: e.target.value })}
          placeholder={t('coLocker.addressPh')}
        />
      </div>

      <div>
        <Label htmlFor="locker-postal">{t('checkout.postalCode')} *</Label>
        <Input
          id="locker-postal"
          value={value.postalCode}
          onChange={(e) => update({ postalCode: e.target.value })}
          placeholder={t('coLocker.postalPh')}
        />
      </div>

      <div>
        <Label className="mb-2 block">{t('coLocker.phone')} *</Label>
        <PhoneInput
          value={value.phone}
          onChange={(v) => update({ phone: v })}
        />
      </div>
    </div>
  );
}
