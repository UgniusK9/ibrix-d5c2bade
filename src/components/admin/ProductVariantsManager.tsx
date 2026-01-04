import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Variant {
  id?: string;
  name: string;
  sku_suffix: string;
  option_type: string;
  option_value: string;
  price_adjustment_eur: number;
  inventory_qty: number;
  status: 'active' | 'inactive';
  sort_order: number;
}

interface ProductVariantsManagerProps {
  productId: string;
  productSku: string;
}

const OPTION_TYPES = [
  { value: 'size', label: 'Dydis' },
  { value: 'color', label: 'Spalva' },
  { value: 'other', label: 'Kita' },
];

export function ProductVariantsManager({ productId, productSku }: ProductVariantsManagerProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadVariants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');

      if (error) throw error;
      setVariants((data || []).map(v => ({
        ...v,
        status: v.status as 'active' | 'inactive'
      })));
    } catch (e) {
      console.error('Failed to load variants:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadVariants();
    }
  }, [productId]);

  const addVariant = () => {
    setVariants(prev => [...prev, {
      name: '',
      sku_suffix: '',
      option_type: 'size',
      option_value: '',
      price_adjustment_eur: 0,
      inventory_qty: 0,
      status: 'active',
      sort_order: prev.length,
    }]);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== index) return v;
      const updated = { ...v, [field]: value };
      // Auto-generate name from type + value
      if (field === 'option_value' || field === 'option_type') {
        updated.name = `${updated.option_value}`;
      }
      return updated;
    }));
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const saveVariants = async () => {
    setSaving(true);
    try {
      // Delete all existing variants
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId);

      // Insert new variants
      if (variants.length > 0) {
        const variantsToInsert = variants.map((v, idx) => ({
          product_id: productId,
          name: v.name || v.option_value,
          sku_suffix: v.sku_suffix,
          option_type: v.option_type,
          option_value: v.option_value,
          price_adjustment_eur: v.price_adjustment_eur,
          inventory_qty: v.inventory_qty,
          status: v.status,
          sort_order: idx,
        }));

        const { error } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);

        if (error) throw error;
      }

      toast.success('Variantai išsaugoti');
      loadVariants();
    } catch (e: any) {
      console.error('Failed to save variants:', e);
      toast.error(e.message || 'Nepavyko išsaugoti variantų');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Produkto variantai</Label>
        <Button type="button" variant="outline" size="sm" onClick={addVariant}>
          <Plus className="w-4 h-4 mr-1" />
          Pridėti variantą
        </Button>
      </div>

      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
          Nėra variantų. Pridėkite variantą, jei norite sekti dydžius, spalvas ir kt.
        </p>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-muted/30">
              <div className="col-span-2">
                <Label className="text-xs">Tipas</Label>
                <Select
                  value={variant.option_type}
                  onValueChange={(v) => updateVariant(index, 'option_type', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Reikšmė</Label>
                <Input
                  className="h-9"
                  placeholder="L, Raudona..."
                  value={variant.option_value}
                  onChange={(e) => updateVariant(index, 'option_value', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">SKU priedėlis</Label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{productSku}-</span>
                  <Input
                    className="h-9"
                    placeholder="L"
                    value={variant.sku_suffix}
                    onChange={(e) => updateVariant(index, 'sku_suffix', e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Kainos pokytis €</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="h-9"
                  value={variant.price_adjustment_eur}
                  onChange={(e) => updateVariant(index, 'price_adjustment_eur', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Kiekis</Label>
                <Input
                  type="number"
                  className="h-9"
                  value={variant.inventory_qty}
                  onChange={(e) => updateVariant(index, 'inventory_qty', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Badge variant={variant.status === 'active' ? 'default' : 'secondary'} className="cursor-pointer"
                  onClick={() => updateVariant(index, 'status', variant.status === 'active' ? 'inactive' : 'active')}
                >
                  {variant.status === 'active' ? 'Aktyvus' : 'Neaktyvus'}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeVariant(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {variants.length > 0 && (
        <Button type="button" onClick={saveVariants} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saugoma...' : 'Išsaugoti variantus'}
        </Button>
      )}
    </div>
  );
}
