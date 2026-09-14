import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Package, Percent, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface BundleRule {
  id: string;
  name: string;
  description: string | null;
  trigger_product_id: string | null;
  trigger_category: string | null;
  trigger_min_qty: number;
  discount_product_id: string | null;
  discount_category: string | null;
  discount_type: string;
  discount_value: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
}

interface Product {
  id: string;
  title: string;
  category: string;
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export function BundlesManager() {
  const { t } = useTranslation();
  const [bundles, setBundles] = useState<BundleRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBundle, setEditBundle] = useState<BundleRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger_type: 'product' as 'product' | 'category',
    trigger_product_id: '',
    trigger_category: '',
    trigger_min_qty: 1,
    discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: 10,
    discount_target_type: 'product' as 'product' | 'category',
    discount_product_id: '',
    discount_category: '',
    active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [bundlesRes, productsRes] = await Promise.all([
        supabase.from('bundle_rules').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id, title, category').eq('status', 'active'),
      ]);

      if (bundlesRes.error) throw bundlesRes.error;
      if (productsRes.error) throw productsRes.error;

      setBundles(bundlesRes.data || []);
      setProducts(productsRes.data || []);
    } catch (e) {
      console.error('Failed to load bundles:', e);
      toast.error(t('admProducts.bundleLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      trigger_type: 'product',
      trigger_product_id: '',
      trigger_category: '',
      trigger_min_qty: 1,
      discount_type: 'percent',
      discount_value: 10,
      discount_target_type: 'product',
      discount_product_id: '',
      discount_category: '',
      active: true,
    });
  };

  const openEdit = (bundle: BundleRule) => {
    setEditBundle(bundle);
    setForm({
      name: bundle.name,
      description: bundle.description || '',
      trigger_type: bundle.trigger_product_id ? 'product' : 'category',
      trigger_product_id: bundle.trigger_product_id || '',
      trigger_category: bundle.trigger_category || '',
      trigger_min_qty: bundle.trigger_min_qty,
      discount_type: bundle.discount_type as 'percent' | 'fixed',
      discount_value: bundle.discount_value,
      discount_target_type: bundle.discount_product_id ? 'product' : 'category',
      discount_product_id: bundle.discount_product_id || '',
      discount_category: bundle.discount_category || '',
      active: bundle.active,
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t('admProducts.bundleEnterName'));
      return;
    }

    const data = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      trigger_product_id: form.trigger_type === 'product' ? form.trigger_product_id || null : null,
      trigger_category: form.trigger_type === 'category' ? form.trigger_category || null : null,
      trigger_min_qty: form.trigger_min_qty,
      discount_product_id: form.discount_target_type === 'product' ? form.discount_product_id || null : null,
      discount_category: form.discount_target_type === 'category' ? form.discount_category || null : null,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      active: form.active,
    };

    try {
      if (editBundle) {
        const { error } = await supabase
          .from('bundle_rules')
          .update(data)
          .eq('id', editBundle.id);
        if (error) throw error;
        toast.success(t('admProducts.bundleUpdated'));
      } else {
        const { error } = await supabase
          .from('bundle_rules')
          .insert(data);
        if (error) throw error;
        toast.success(t('admProducts.bundleCreated'));
      }

      setEditBundle(null);
      setIsCreating(false);
      resetForm();
      await loadData();
    } catch (e: any) {
      console.error('Failed to save bundle:', e);
      toast.error(e.message || t('admCommon.saveFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admProducts.bundleDeleteConfirm'))) return;

    try {
      const { error } = await supabase.from('bundle_rules').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('admProducts.bundleDeleted'));
      await loadData();
    } catch (e) {
      console.error('Failed to delete bundle:', e);
      toast.error(t('admCommon.deleteFailed'));
    }
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">{t('admProducts.bundleTitle')}</h2>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admCommon.refresh')}
          </Button>
          <Button onClick={() => { resetForm(); setIsCreating(true); }} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {t('admProducts.bundleNew')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : bundles.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{t('admProducts.bundleEmpty')}</p>
          <Button onClick={() => { resetForm(); setIsCreating(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            {t('admProducts.bundleCreateFirst')}
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admCommon.name')}</TableHead>
                <TableHead>{t('admProducts.bundleTrigger')}</TableHead>
                <TableHead>{t('cart.discount')}</TableHead>
                <TableHead>{t('admCommon.status')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundles.map((bundle) => {
                const triggerProduct = products.find(p => p.id === bundle.trigger_product_id);
                const discountProduct = products.find(p => p.id === bundle.discount_product_id);
                
                return (
                  <TableRow key={bundle.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{bundle.name}</p>
                        {bundle.description && (
                          <p className="text-xs text-muted-foreground">{bundle.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {bundle.trigger_product_id && (
                          <span>{t('admProducts.bundleBuys', { title: triggerProduct?.title || t('admCommon.product') })}</span>
                        )}
                        {bundle.trigger_category && (
                          <span>{t('products.category')}: {bundle.trigger_category}</span>
                        )}
                        {bundle.trigger_min_qty > 1 && (
                          <span className="text-muted-foreground"> {t('admProducts.bundleMinQty', { num: bundle.trigger_min_qty })}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {bundle.discount_type === 'percent' ? (
                          <>
                            <Percent className="w-3 h-3" />
                            -{bundle.discount_value}%
                          </>
                        ) : (
                          <>-{formatPrice(bundle.discount_value)}</>
                        )}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {bundle.discount_product_id && discountProduct?.title}
                        {bundle.discount_category && `${t('products.category')}: ${bundle.discount_category}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={bundle.active ? 'default' : 'secondary'}>
                        {bundle.active ? t('admCommon.active') : t('admCommon.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(bundle)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(bundle.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editBundle} onOpenChange={() => { setIsCreating(false); setEditBundle(null); resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editBundle ? t('common.edit') : t('admProducts.bundleNewFem')} {t('admProducts.bundleRuleWord')}</DialogTitle>
            <DialogDescription>
              {t('admProducts.bundleExample')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admCommon.name')} *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={t('admProducts.bundleNamePh')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('products.description')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={t('admProducts.bundleDescPh')}
                rows={2}
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <h4 className="font-medium text-sm">{t('admProducts.bundleTriggerWhen')}</h4>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.trigger_type === 'product'}
                    onChange={() => setForm(f => ({ ...f, trigger_type: 'product' }))}
                  />
                  {t('admCommon.product')}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.trigger_type === 'category'}
                    onChange={() => setForm(f => ({ ...f, trigger_type: 'category' }))}
                  />
                  {t('products.category')}
                </label>
              </div>

              {form.trigger_type === 'product' ? (
                <Select value={form.trigger_product_id} onValueChange={(v) => setForm(f => ({ ...f, trigger_product_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admProducts.bundleSelectProduct')} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={form.trigger_category} onValueChange={(v) => setForm(f => ({ ...f, trigger_category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admProducts.bundleSelectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center gap-2">
                <Label className="shrink-0">{t('admProducts.bundleMinQtyLabel')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.trigger_min_qty}
                  onChange={(e) => setForm(f => ({ ...f, trigger_min_qty: parseInt(e.target.value) || 1 }))}
                  className="w-20"
                />
              </div>
            </div>

            <div className="p-4 bg-accent/10 rounded-lg space-y-4">
              <h4 className="font-medium text-sm">{t('admProducts.bundleDiscountFor')}</h4>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.discount_target_type === 'product'}
                    onChange={() => setForm(f => ({ ...f, discount_target_type: 'product' }))}
                  />
                  {t('admCommon.product')}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.discount_target_type === 'category'}
                    onChange={() => setForm(f => ({ ...f, discount_target_type: 'category' }))}
                  />
                  {t('products.category')}
                </label>
              </div>

              {form.discount_target_type === 'product' ? (
                <Select value={form.discount_product_id} onValueChange={(v) => setForm(f => ({ ...f, discount_product_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admProducts.bundleSelectProduct')} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={form.discount_category} onValueChange={(v) => setForm(f => ({ ...f, discount_category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admProducts.bundleSelectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center gap-4">
                <Select value={form.discount_type} onValueChange={(v: 'percent' | 'fixed') => setForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">{t('admProducts.bundlePercent')}</SelectItem>
                    <SelectItem value="fixed">{t('admProducts.bundleFixed')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    value={form.discount_value}
                    onChange={(e) => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))}
                    className="w-20"
                  />
                  <span>{form.discount_type === 'percent' ? '%' : '€'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm(f => ({ ...f, active: checked }))}
              />
              <Label>{t('admCommon.active')}</Label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setIsCreating(false); setEditBundle(null); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              {t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}