import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface InvoiceFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  wantsInvoice: boolean;
  onWantsInvoiceChange: (value: boolean) => void;
}

export function InvoiceFields({ 
  register, 
  errors, 
  wantsInvoice, 
  onWantsInvoiceChange 
}: InvoiceFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="wantsInvoice" className="flex items-center gap-2 cursor-pointer">
          <Building2 className="w-4 h-4" />
          Noriu sąskaitos faktūros (B2B)
        </Label>
        <Switch
          id="wantsInvoice"
          checked={wantsInvoice}
          onCheckedChange={onWantsInvoiceChange}
        />
      </div>
      
      {wantsInvoice && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
          <div>
            <Label htmlFor="invoiceCompanyName">Įmonės pavadinimas *</Label>
            <Input 
              {...register('invoiceCompanyName')} 
              id="invoiceCompanyName" 
              placeholder="UAB Pavyzdys"
            />
            {errors.invoiceCompanyName && (
              <p className="text-destructive text-sm mt-1">
                {errors.invoiceCompanyName.message as string}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="invoiceVatCode">Įmonės kodas / PVM kodas</Label>
            <Input 
              {...register('invoiceVatCode')} 
              id="invoiceVatCode" 
              placeholder="123456789 arba LT123456789"
            />
            {errors.invoiceVatCode && (
              <p className="text-destructive text-sm mt-1">
                {errors.invoiceVatCode.message as string}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="invoiceAddress">Įmonės adresas *</Label>
            <Input 
              {...register('invoiceAddress')} 
              id="invoiceAddress" 
              placeholder="Gatvė 1, Miestas, LT-00000"
            />
            {errors.invoiceAddress && (
              <p className="text-destructive text-sm mt-1">
                {errors.invoiceAddress.message as string}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
