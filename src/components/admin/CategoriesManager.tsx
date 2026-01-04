import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, FolderTree, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: '',
    sort_order: 0,
    active: true,
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setCategories(data || []);
    } catch (e) {
      console.error('Failed to load categories:', e);
      toast.error('Nepavyko užkrauti kategorijų');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[ąą]/g, 'a')
      .replace(/[čč]/g, 'c')
      .replace(/[ęę]/g, 'e')
      .replace(/[ėė]/g, 'e')
      .replace(/[įį]/g, 'i')
      .replace(/[šš]/g, 's')
      .replace(/[ųų]/g, 'u')
      .replace(/[ūū]/g, 'u')
      .replace(/[žž]/g, 'z')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      parent_id: '',
      sort_order: categories.length,
      active: true,
    });
    setShowDialog(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      parent_id: category.parent_id || '',
      sort_order: category.sort_order,
      active: category.active,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Pavadinimas ir slug yra privalomi');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        image_url: formData.image_url || null,
        parent_id: formData.parent_id || null,
        sort_order: formData.sort_order,
        active: formData.active,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Kategorija atnaujinta');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(payload);
        if (error) throw error;
        toast.success('Kategorija sukurta');
      }

      setShowDialog(false);
      loadCategories();
    } catch (e: any) {
      console.error('Failed to save category:', e);
      toast.error(e.message || 'Nepavyko išsaugoti kategorijos');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Ar tikrai norite ištrinti kategoriją "${category.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);
      if (error) throw error;
      toast.success('Kategorija ištrinta');
      loadCategories();
    } catch (e: any) {
      console.error('Failed to delete category:', e);
      toast.error(e.message || 'Nepavyko ištrinti kategorijos');
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return null;
    const parent = categories.find(c => c.id === parentId);
    return parent?.name || null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <FolderTree className="w-5 h-5" />
              Kategorijos
            </CardTitle>
            <CardDescription>Produktų kategorijų valdymas</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadCategories} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atnaujinti
            </Button>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nauja kategorija
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderTree className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nėra kategorijų</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  
                  {/* Category image preview */}
                  <div className="w-12 h-12 rounded-lg bg-secondary/50 overflow-hidden flex-shrink-0">
                    {category.image_url ? (
                      <img 
                        src={category.image_url} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderTree className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      <Badge variant={category.active ? 'default' : 'secondary'}>
                        {category.active ? 'Aktyvi' : 'Neaktyvi'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>/{category.slug}</span>
                      {getParentName(category.parent_id) && (
                        <span>• Tėvinė: {getParentName(category.parent_id)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(category)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Redaguoti kategoriją' : 'Nauja kategorija'}
              </DialogTitle>
              <DialogDescription>
                Užpildykite kategorijos informaciją
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pavadinimas *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        slug: editingCategory ? formData.slug : generateSlug(e.target.value),
                      });
                    }}
                    placeholder="Varikliai"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="varikliai"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Aprašymas</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kategorijos aprašymas..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Nuotraukos URL</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded-lg border"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tėvinė kategorija</Label>
                  <Select
                    value={formData.parent_id}
                    onValueChange={(v) => setFormData({ ...formData, parent_id: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nėra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nėra (pagrindinė)</SelectItem>
                      {categories
                        .filter(c => c.id !== editingCategory?.id)
                        .map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rikiavimo eilė</Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label>Aktyvi kategorija</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Atšaukti
              </Button>
              <Button onClick={handleSave}>
                {editingCategory ? 'Atnaujinti' : 'Sukurti'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
