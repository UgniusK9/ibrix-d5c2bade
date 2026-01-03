import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, RefreshCw, ChevronDown, X, ImagePlus, Save } from 'lucide-react';
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
  stock_status: StockStatus;
  status: ProductStatus;
  category: ProductCategory;
  images: string[];
  preorder_eta_weeks_min: number | null;
  preorder_eta_weeks_max: number | null;
  inventory_qty: number | null;
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  sku: string;
  slug: string;
  title: string;
  short_desc: string;
  description: string;
  price_eur: string;
  deposit_eur: string;
  stock_status: StockStatus;
  status: ProductStatus;
  category: ProductCategory;
  images: string[];
  preorder_eta_weeks_min: string;
  preorder_eta_weeks_max: string;
  inventory_qty: string;
}

const emptyFormData: ProductFormData = {
  sku: '',
  slug: '',
  title: '',
  short_desc: '',
  description: '',
  price_eur: '',
  deposit_eur: '',
  stock_status: 'preorder',
  status: 'active',
  category: 'engines',
  images: [],
  preorder_eta_weeks_min: '',
  preorder_eta_weeks_max: '',
  inventory_qty: '0',
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<StockStatus | 'all'>('all');
  
  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin', {
        body: { action: 'list_products' }
      });

      if (error) throw error;
      if (data?.products) {
        // Parse images from JSON to array
        const parsedProducts = data.products.map((p: any) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images : 
                  typeof p.images === 'string' ? JSON.parse(p.images) : []
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

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreateForm = () => {
    setEditingProduct(null);
    setFormData(emptyFormData);
    setFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      slug: product.slug,
      title: product.title,
      short_desc: product.short_desc || '',
      description: product.description || '',
      price_eur: product.price_eur.toString(),
      deposit_eur: product.deposit_eur.toString(),
      stock_status: product.stock_status,
      status: product.status,
      category: product.category,
      images: product.images || [],
      preorder_eta_weeks_min: product.preorder_eta_weeks_min?.toString() || '',
      preorder_eta_weeks_max: product.preorder_eta_weeks_max?.toString() || '',
      inventory_qty: product.inventory_qty?.toString() || '0',
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
      const productData = {
        sku: formData.sku.trim(),
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        short_desc: formData.short_desc.trim() || null,
        description: formData.description.trim() || null,
        price_eur: parseFloat(formData.price_eur),
        deposit_eur: parseFloat(formData.deposit_eur),
        stock_status: formData.stock_status,
        status: formData.status,
        category: formData.category,
        images: formData.images,
        preorder_eta_weeks_min: formData.preorder_eta_weeks_min ? parseInt(formData.preorder_eta_weeks_min) : null,
        preorder_eta_weeks_max: formData.preorder_eta_weeks_max ? parseInt(formData.preorder_eta_weeks_max) : null,
        inventory_qty: parseInt(formData.inventory_qty) || 0,
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
      const { error } = await supabase.functions.invoke('admin', {
        body: { action: 'delete_product', productId: productToDelete.id }
      });

      if (error) throw error;
      
      toast.success('Produktas ištrintas');
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
                <Label htmlFor="price_eur">Kaina (EUR) *</Label>
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
                  Suma, mokama užsisakant (≤ kaina)
                </p>
              </div>
            </div>

            {/* Status and Category */}
            <div className="grid grid-cols-3 gap-4">
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
              <div>
                <Label>Kategorija</Label>
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

            {/* Images */}
            <div className="space-y-3">
              <Label>Nuotraukos</Label>
              <div className="flex gap-2">
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://... nuotraukos URL"
                />
                <Button type="button" variant="outline" onClick={addImage}>
                  <ImagePlus className="w-4 h-4" />
                </Button>
              </div>
              
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Product ${index + 1}`}
                        className="w-20 h-20 rounded object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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
