import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, RefreshCw, ChevronDown, X, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Database } from '@/integrations/supabase/types';
import { ProductVariantsManager } from './ProductVariantsManager';
import { MultiImageUpload } from './MultiImageUpload';

type ProductStatus = Database['public']['Enums']['product_status'];
type StockStatus = Database['public']['Enums']['stock_status'];
type ProductCategory = Database['public']['Enums']['product_category'];

interface Product {
  id: string;
  sku: string;
  slug: string;
  title: string;
  short_desc: string | null;
  description: string | null;
  price_eur: number;
  deposit_eur: number;
  sale_price_eur: number | null;
  cost_price_eur: number | null;
  stock_status: StockStatus;
  status: ProductStatus;
  category: ProductCategory;
  category_id: string | null;
  images: string[];
  badges: string[];
  tags: string[];
  preorder_eta_weeks_min: number | null;
  preorder_eta_weeks_max: number | null;
  inventory_qty: number | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

type AgeCategory = '18+' | '10-17' | '4-9' | '';

interface ProductFormData {
  sku: string;
  slug: string;
  title: string;
  short_desc: string;
  description: string;
  price_eur: string;
  deposit_eur: string;
  sale_price_eur: string;
  cost_price_eur: string;
  credits_cost_eur: string;
  stock_status: StockStatus;
  status: ProductStatus;
  category: ProductCategory;
  category_id: string;
  images: string[];
  badges: string[];
  tags: string[];
  tagsInput: string;
  preorder_eta_weeks_min: string;
  preorder_eta_weeks_max: string;
  inventory_qty: string;
  age_category: AgeCategory;
  details_count: string;
}

const emptyFormData: ProductFormData = {
  sku: '',
  slug: '',
  title: '',
  short_desc: '',
  description: '',
  price_eur: '',
  deposit_eur: '',
  sale_price_eur: '',
  cost_price_eur: '',
  credits_cost_eur: '',
  stock_status: 'preorder',
  status: 'active',
  category: 'engines',
  category_id: '',
  images: [],
  badges: [],
  tags: [],
  tagsInput: '',
  preorder_eta_weeks_min: '',
  preorder_eta_weeks_max: '',
  inventory_qty: '0',
  age_category: '',
  details_count: '',
};

const AGE_CATEGORY_OPTIONS = [
  { value: '18+', label: '18+', ageMin: 18 },
  { value: '10-17', label: '10-17', ageMin: 10 },
  { value: '4-9', label: '4-9', ageMin: 4 },
];

const BADGE_OPTIONS = [
  { value: 'new', label: 'Naujiena', color: 'bg-green-500' },
  { value: 'popular', label: 'Populiarus', color: 'bg-orange-500' },
  { value: 'sale', label: 'Išpardavimas', color: 'bg-red-500' },
  { value: 'limited', label: 'Ribotas', color: 'bg-purple-500' },
];

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('active');
  const [stockFilter, setStockFilter] = useState<StockStatus | 'all'>('all');
  
  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteAllProgress, setDeleteAllProgress] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin', {
        body: { action: 'list_products' }
      });

      if (error) throw error;
      if (data?.products) {
        // Parse images, badges, and tags from JSON to array
        const parsedProducts = data.products.map((p: any) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images : 
                  typeof p.images === 'string' ? JSON.parse(p.images) : [],
          badges: Array.isArray(p.badges) ? p.badges : 
                  typeof p.badges === 'string' ? JSON.parse(p.badges) : [],
          tags: Array.isArray(p.tags) ? p.tags : []
        }));
        setProducts(parsedProducts);
      }
    } catch (e: any) {
      console.error('Failed to load products:', e);
      toast.error('Nepavyko užkrauti produktų');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, active')
        .eq('active', true)
        .order('sort_order');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (e: any) {
      console.error('Failed to load categories:', e);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const openCreateForm = () => {
    setEditingProduct(null);
    setFormData(emptyFormData);
    setFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    // Extract age category from details_json
    const detailsJson = (product as any).details_json as Record<string, unknown> | null;
    const ageMin = detailsJson?.ageMin as number | undefined;
    let ageCategory: AgeCategory = '';
    if (ageMin !== undefined) {
      if (ageMin >= 18) ageCategory = '18+';
      else if (ageMin >= 10) ageCategory = '10-17';
      else if (ageMin >= 4) ageCategory = '4-9';
    }
    const detailsCount = (detailsJson?.detailsCount as number) || (detailsJson?.piecesCount as number) || undefined;
    
    setFormData({
      sku: product.sku,
      slug: product.slug,
      title: product.title,
      short_desc: product.short_desc || '',
      description: product.description || '',
      price_eur: product.price_eur.toString(),
      deposit_eur: product.deposit_eur.toString(),
      sale_price_eur: product.sale_price_eur?.toString() || '',
      cost_price_eur: product.cost_price_eur?.toString() || '',
      credits_cost_eur: (product as any).credits_cost_eur?.toString() || '',
      stock_status: product.stock_status,
      status: product.status,
      category: product.category,
      category_id: product.category_id || '',
      images: product.images || [],
      badges: product.badges || [],
      tags: product.tags || [],
      tagsInput: (product.tags || []).join(', '),
      preorder_eta_weeks_min: product.preorder_eta_weeks_min?.toString() || '',
      preorder_eta_weeks_max: product.preorder_eta_weeks_max?.toString() || '',
      inventory_qty: product.inventory_qty?.toString() || '0',
      age_category: ageCategory,
      details_count: detailsCount?.toString() || '',
    });
    setFormOpen(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value)
    }));
  };

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, newImageUrl.trim()]
    }));
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.sku.trim()) return 'SKU yra privalomas';
    if (!formData.slug.trim()) return 'Slug yra privalomas';
    if (!formData.title.trim()) return 'Pavadinimas yra privalomas';
    
    const price = parseFloat(formData.price_eur);
    const deposit = parseFloat(formData.deposit_eur);
    
    if (isNaN(price) || price <= 0) return 'Kaina turi būti didesnė nei 0';
    if (isNaN(deposit) || deposit < 0) return 'Depozitas negali būti neigiamas';
    if (deposit > price) return 'Depozitas negali viršyti kainos';
    
    if (formData.stock_status === 'preorder') {
      const minEta = parseInt(formData.preorder_eta_weeks_min);
      const maxEta = parseInt(formData.preorder_eta_weeks_max);
      if (isNaN(minEta) || minEta < 1) return 'Pre-order produktams reikia nurodyti ETA savaites';
      if (!isNaN(maxEta) && maxEta < minEta) return 'Max ETA negali būti mažesnis už Min ETA';
    }
    
    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      // Parse tags from input
      const parsedTags = formData.tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      // Build details_json with age and piece count
      const ageCategoryOption = AGE_CATEGORY_OPTIONS.find(o => o.value === formData.age_category);
      const detailsJson: Record<string, unknown> = {};
      if (ageCategoryOption) {
        detailsJson.ageMin = ageCategoryOption.ageMin;
      }
      if (formData.details_count) {
        detailsJson.detailsCount = parseInt(formData.details_count);
      }

      const productData = {
        sku: formData.sku.trim(),
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        short_desc: formData.short_desc.trim() || null,
        description: formData.description.trim() || null,
        price_eur: parseFloat(formData.price_eur),
        deposit_eur: parseFloat(formData.deposit_eur),
        sale_price_eur: formData.sale_price_eur ? parseFloat(formData.sale_price_eur) : null,
        cost_price_eur: formData.cost_price_eur ? parseFloat(formData.cost_price_eur) : null,
        credits_cost_eur: formData.credits_cost_eur ? parseFloat(formData.credits_cost_eur) : null,
        stock_status: formData.stock_status,
        status: formData.status,
        category: formData.category,
        category_id: formData.category_id || null,
        images: formData.images,
        badges: formData.badges,
        tags: parsedTags,
        preorder_eta_weeks_min: formData.preorder_eta_weeks_min ? parseInt(formData.preorder_eta_weeks_min) : null,
        preorder_eta_weeks_max: formData.preorder_eta_weeks_max ? parseInt(formData.preorder_eta_weeks_max) : null,
        inventory_qty: parseInt(formData.inventory_qty) || 0,
        details_json: Object.keys(detailsJson).length > 0 ? detailsJson : null,
      };

      const { data, error } = await supabase.functions.invoke('admin', {
        body: {
          action: editingProduct ? 'update_product' : 'create_product',
          ...(editingProduct ? { productId: editingProduct.id } : {}),
          ...productData
        }
      });

      if (error) throw error;
      
      toast.success(editingProduct ? 'Produktas atnaujintas' : 'Produktas sukurtas');
      setFormOpen(false);
      loadProducts();
    } catch (e: any) {
      console.error('Failed to save product:', e);
      toast.error(e.message || 'Nepavyko išsaugoti produkto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('admin', {
        body: { action: 'delete_product', productId: productToDelete.id }
      });

      if (error) throw error;

      if (data?.archived) {
        toast.success(data.message || 'Produktas turi užsakymų — deaktyvuotas vietoje ištrynimo');
      } else {
        toast.success('Produktas ištrintas');
      }
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      loadProducts();
    } catch (e: any) {
      console.error('Failed to delete product:', e);
      toast.error(e.message || 'Nepavyko ištrinti produkto');
    }
  };

  const filteredProducts = products.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (stockFilter !== 'all' && p.stock_status !== stockFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return p.title.toLowerCase().includes(s) || 
             p.sku.toLowerCase().includes(s) ||
             p.slug.toLowerCase().includes(s);
    }
    return true;
  });

  const getStockStatusBadge = (status: StockStatus) => {
    const config = {
      'preorder': { label: 'Pre-order', className: 'bg-primary/10 text-primary' },
      'in_stock': { label: 'Sandėlyje', className: 'bg-green-500/10 text-green-600' },
      'out_of_stock': { label: 'Išparduota', className: 'bg-destructive/10 text-destructive' },
    };
    const c = config[status];
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: ProductStatus) => {
    const config = {
      'active': { label: 'Aktyvus', className: 'bg-green-500/10 text-green-600' },
      'inactive': { label: 'Neaktyvus', className: 'bg-muted text-muted-foreground' },
    };
    const c = config[status];
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ieškoti..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProductStatus | 'all')}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Statusas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Visi statusai</SelectItem>
              <SelectItem value="active">Aktyvūs</SelectItem>
              <SelectItem value="inactive">Neaktyvūs</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockStatus | 'all')}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Likutis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Visos būsenos</SelectItem>
              <SelectItem value="preorder">Pre-order</SelectItem>
              <SelectItem value="in_stock">Sandėlyje</SelectItem>
              <SelectItem value="out_of_stock">Išparduota</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={loadProducts} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atnaujinti
          </Button>
          <Button onClick={openCreateForm}>
            <Plus className="w-4 h-4 mr-2" />
            Naujas produktas
          </Button>
        </div>
      </div>

      {/* Products table */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Kraunama...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">
            {products.length === 0 ? 'Nėra produktų' : 'Nerasta produktų'}
          </h2>
          <p className="text-muted-foreground">
            {products.length === 0 
              ? 'Sukurkite pirmą produktą spaudžiant "Naujas produktas"' 
              : 'Pabandykite pakeisti filtrus arba paiešką'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16"></TableHead>
                <TableHead>Produktas</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Kaina</TableHead>
                <TableHead>Depozitas</TableHead>
                <TableHead>Būsena</TableHead>
                <TableHead>Statusas</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.images?.[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-xs text-muted-foreground">/{product.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell className="font-semibold">{formatPrice(product.price_eur)}</TableCell>
                  <TableCell className="text-primary">{formatPrice(product.deposit_eur)}</TableCell>
                  <TableCell>{getStockStatusBadge(product.stock_status)}</TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditForm(product)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Redaguoti
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => { setProductToDelete(product); setDeleteDialogOpen(true); }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Ištrinti
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingProduct ? 'Redaguoti produktą' : 'Naujas produktas'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? `Redaguojamas: ${editingProduct.title}` : 'Užpildykite produkto informaciją'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Pavadinimas *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Produkto pavadinimas"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="PROD-001"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="produktas-pavadinimas"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="short_desc">Trumpas aprašymas</Label>
                <Input
                  id="short_desc"
                  value={formData.short_desc}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_desc: e.target.value }))}
                  placeholder="Trumpas aprašymas produktų sąraše"
                />
              </div>
              <div>
                <Label htmlFor="description">Pilnas aprašymas</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalus produkto aprašymas..."
                  rows={4}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_eur">Pardavimo kaina (EUR) *</Label>
                <Input
                  id="price_eur"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.price_eur}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_eur: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="deposit_eur">Depozitas (EUR) *</Label>
                <Input
                  id="deposit_eur"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.deposit_eur}
                  onChange={(e) => setFormData(prev => ({ ...prev, deposit_eur: e.target.value }))}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Suma užsakant
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sale_price_eur">Akcijos kaina (EUR)</Label>
                <Input
                  id="sale_price_eur"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sale_price_eur}
                  onChange={(e) => setFormData(prev => ({ ...prev, sale_price_eur: e.target.value }))}
                  placeholder="Palikti tuščią jei nėra akcijos"
                  className={formData.sale_price_eur ? "border-orange-500 focus-visible:ring-orange-500" : ""}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Rodoma kaip nuolaida
                </p>
              </div>
              <div>
                <Label htmlFor="cost_price_eur">Savikaina (EUR)</Label>
                <Input
                  id="cost_price_eur"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_price_eur}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_price_eur: e.target.value }))}
                  placeholder="0.00"
                />
                {/* Profit calculation */}
                {formData.cost_price_eur && formData.price_eur && (
                  (() => {
                    const cost = parseFloat(formData.cost_price_eur);
                    const price = formData.sale_price_eur ? parseFloat(formData.sale_price_eur) : parseFloat(formData.price_eur);
                    if (!isNaN(cost) && !isNaN(price) && cost > 0) {
                      const profit = price - cost;
                      const margin = ((profit / price) * 100).toFixed(1);
                      const isPositive = profit > 0;
                      return (
                        <div className={`text-xs mt-1 font-medium ${isPositive ? 'text-green-600' : 'text-destructive'}`}>
                          Pelnas: {formatPrice(profit)} ({margin}% marža)
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
              </div>
            </div>

            {/* Status and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Būsena</Label>
                <Select 
                  value={formData.stock_status} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, stock_status: v as StockStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preorder">Pre-order</SelectItem>
                    <SelectItem value="in_stock">Sandėlyje</SelectItem>
                    <SelectItem value="out_of_stock">Išparduota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statusas</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as ProductStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktyvus</SelectItem>
                    <SelectItem value="inactive">Neaktyvus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategorija</Label>
                <Select 
                  value={formData.category_id || "none"} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v === "none" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pasirinkite kategoriją" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nepasirinkta</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Skiltis</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as ProductCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engines">Varikliai</SelectItem>
                    <SelectItem value="cars">Automobiliai</SelectItem>
                    <SelectItem value="flowers">Gėlės</SelectItem>
                    <SelectItem value="other">Kita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Age Category & Details Count */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amžiaus kategorija</Label>
                <Select 
                  value={formData.age_category || "none"} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, age_category: v === "none" ? "" : v as AgeCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pasirinkite amžių" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nepasirinkta</SelectItem>
                    {AGE_CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Rodoma produkto kortelėje
                </p>
              </div>
              <div>
                <Label htmlFor="details_count">Detalių skaičius</Label>
                <Input
                  id="details_count"
                  type="number"
                  min="0"
                  value={formData.details_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, details_count: e.target.value }))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Konstruktoriaus detalių kiekis
                </p>
              </div>
            </div>

            {/* Pre-order ETA */}
            {formData.stock_status === 'preorder' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eta_min">ETA min (savaitės) *</Label>
                  <Input
                    id="eta_min"
                    type="number"
                    min="1"
                    value={formData.preorder_eta_weeks_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, preorder_eta_weeks_min: e.target.value }))}
                    placeholder="4"
                  />
                </div>
                <div>
                  <Label htmlFor="eta_max">ETA max (savaitės)</Label>
                  <Input
                    id="eta_max"
                    type="number"
                    min="1"
                    value={formData.preorder_eta_weeks_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, preorder_eta_weeks_max: e.target.value }))}
                    placeholder="6"
                  />
                </div>
              </div>
            )}

            {/* Inventory */}
            {formData.stock_status === 'in_stock' && (
              <div className="w-1/2">
                <Label htmlFor="inventory_qty">Kiekis sandėlyje</Label>
                <Input
                  id="inventory_qty"
                  type="number"
                  min="0"
                  value={formData.inventory_qty}
                  onChange={(e) => setFormData(prev => ({ ...prev, inventory_qty: e.target.value }))}
                  placeholder="0"
                />
              </div>
            )}

            {/* Badges */}
            <div className="space-y-3">
              <Label>Ženkliukai</Label>
              <div className="flex flex-wrap gap-2">
                {BADGE_OPTIONS.map((badge) => {
                  const isSelected = formData.badges.includes(badge.value);
                  return (
                    <button
                      key={badge.value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          badges: isSelected
                            ? prev.badges.filter(b => b !== badge.value)
                            : [...prev.badges, badge.value]
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? `${badge.color} text-white`
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {badge.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Žymės (atskirtos kableliais)</Label>
              <Input
                id="tags"
                value={formData.tagsInput}
                onChange={(e) => setFormData(prev => ({ ...prev, tagsInput: e.target.value }))}
                placeholder="v8, variklis, porsche, klasika"
              />
              <p className="text-xs text-muted-foreground">
                Naudojamos susijusių produktų rekomendacijoms
              </p>
            </div>

            {/* Credits Cost */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎁</span>
                <Label className="text-amber-700 dark:text-amber-300 font-semibold">Kreditų kaina</Label>
              </div>
              <Input
                id="credits_cost_eur"
                type="number"
                step="0.01"
                min="0"
                value={formData.credits_cost_eur}
                onChange={(e) => setFormData(prev => ({ ...prev, credits_cost_eur: e.target.value }))}
                placeholder="Palikti tuščią jei negalima įsigyti už kreditus"
                className="bg-white dark:bg-background"
              />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Kiek kreditų (EUR vertė) reikia, kad klientas galėtų gauti šį produktą nemokamai. 
                Jei tuščia - produkto negalima įsigyti už kreditus.
              </p>
            </div>

            {/* Images - Multi Image Upload */}
            <MultiImageUpload
              value={formData.images}
              onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
              folder="products"
              label="Konstruktoriaus nuotraukos"
              maxImages={10}
            />
          </div>

          {/* Variants Manager - only show when editing existing product */}
          {editingProduct && (
            <div className="border-t pt-6">
              <ProductVariantsManager productId={editingProduct.id} productSku={editingProduct.sku} />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Atšaukti
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saugoma...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingProduct ? 'Atnaujinti' : 'Sukurti'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ištrinti produktą?</AlertDialogTitle>
            <AlertDialogDescription>
              Ar tikrai norite ištrinti "{productToDelete?.title}"? 
              Šis veiksmas negrįžtamas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Atšaukti</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ištrinti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
