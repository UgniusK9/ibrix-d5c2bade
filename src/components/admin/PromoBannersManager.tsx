import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Image, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ImageUpload } from './ImageUpload';

interface PromoBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  background_color: string;
  link_url: string;
  link_text: string;
  secondary_link_url: string | null;
  secondary_link_text: string | null;
  badge_text: string | null;
  badge_variant: string;
  active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export function PromoBannersManager() {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    background_color: '#1E4ED8',
    link_url: '/produktai/visi',
    link_text: 'Pirkti dabar',
    secondary_link_url: '',
    secondary_link_text: '',
    badge_text: '',
    badge_variant: 'default',
    active: true,
    sort_order: 0,
  });

  const loadBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setBanners(data || []);
    } catch (e) {
      console.error('Failed to load banners:', e);
      toast.error('Nepavyko užkrauti banerių');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const openCreateDialog = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      background_color: '#1E4ED8',
      link_url: '/produktai/visi',
      link_text: 'Pirkti dabar',
      secondary_link_url: '',
      secondary_link_text: '',
      badge_text: '',
      badge_variant: 'default',
      active: true,
      sort_order: banners.length,
    });
    setShowDialog(true);
  };

  const openEditDialog = (banner: PromoBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url || '',
      background_color: banner.background_color || '#1E4ED8',
      link_url: banner.link_url,
      link_text: banner.link_text || 'Pirkti dabar',
      secondary_link_url: banner.secondary_link_url || '',
      secondary_link_text: banner.secondary_link_text || '',
      badge_text: banner.badge_text || '',
      badge_variant: banner.badge_variant || 'default',
      active: banner.active,
      sort_order: banner.sort_order,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Pavadinimas yra privalomas');
      return;
    }

    try {
      const payload = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        image_url: formData.image_url || null,
        background_color: formData.background_color,
        link_url: formData.link_url,
        link_text: formData.link_text,
        secondary_link_url: formData.secondary_link_url || null,
        secondary_link_text: formData.secondary_link_text || null,
        badge_text: formData.badge_text || null,
        badge_variant: formData.badge_variant,
        active: formData.active,
        sort_order: formData.sort_order,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('promo_banners')
          .update(payload)
          .eq('id', editingBanner.id);
        if (error) throw error;
        toast.success('Baneris atnaujintas');
      } else {
        const { error } = await supabase
          .from('promo_banners')
          .insert(payload);
        if (error) throw error;
        toast.success('Baneris sukurtas');
      }

      setShowDialog(false);
      loadBanners();
    } catch (e: any) {
      console.error('Failed to save banner:', e);
      toast.error(e.message || 'Nepavyko išsaugoti banerio');
    }
  };

  const handleDelete = async (banner: PromoBanner) => {
    if (!confirm(`Ar tikrai norite ištrinti banerį "${banner.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('promo_banners')
        .delete()
        .eq('id', banner.id);
      if (error) throw error;
      toast.success('Baneris ištrintas');
      loadBanners();
    } catch (e: any) {
      console.error('Failed to delete banner:', e);
      toast.error(e.message || 'Nepavyko ištrinti banerio');
    }
  };

  const toggleActive = async (banner: PromoBanner) => {
    try {
      const { error } = await supabase
        .from('promo_banners')
        .update({ active: !banner.active })
        .eq('id', banner.id);
      if (error) throw error;
      toast.success(banner.active ? 'Baneris išjungtas' : 'Baneris įjungtas');
      loadBanners();
    } catch (e: any) {
      toast.error('Nepavyko pakeisti statuso');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Image className="w-5 h-5" />
              Promo baneriai
            </CardTitle>
            <CardDescription>Valdykite pagrindinio puslapio banerius</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadBanners} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atnaujinti
            </Button>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Naujas baneris
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nėra banerių</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Preview */}
                <div 
                  className="w-32 h-20 rounded-lg flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: banner.background_color }}
                >
                  {banner.image_url ? (
                    <img 
                      src={banner.image_url} 
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/60">
                      <Image className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{banner.title}</span>
                    <Badge variant={banner.active ? 'default' : 'secondary'}>
                      {banner.active ? 'Aktyvus' : 'Neaktyvus'}
                    </Badge>
                    {banner.badge_text && (
                      <Badge variant="outline" className="text-xs">
                        {banner.badge_text}
                      </Badge>
                    )}
                  </div>
                  {banner.subtitle && (
                    <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <ExternalLink className="w-3 h-3" />
                    <span>{banner.link_url}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleActive(banner)}
                    title={banner.active ? 'Išjungti' : 'Įjungti'}
                  >
                    {banner.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(banner)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(banner)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Redaguoti banerį' : 'Naujas baneris'}
              </DialogTitle>
              <DialogDescription>
                Sukurkite reklaminio banerio turinį
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pavadinimas *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Naujiena!"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Badge tekstas</Label>
                  <Input
                    value={formData.badge_text}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    placeholder="Naujiena"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Paantraštė</Label>
                <Textarea
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Atraskite naujausius..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  folder="banners"
                  label="Banerio nuotrauka"
                />
                <div className="space-y-2">
                  <Label>Fono spalva</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      placeholder="#1E4ED8"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pagrindinis mygtukas URL</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="/produktai/visi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pagrindinis mygtukas tekstas</Label>
                  <Input
                    value={formData.link_text}
                    onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                    placeholder="Pirkti dabar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Antrinis mygtukas URL</Label>
                  <Input
                    value={formData.secondary_link_url}
                    onChange={(e) => setFormData({ ...formData, secondary_link_url: e.target.value })}
                    placeholder="/pre-order"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Antrinis mygtukas tekstas</Label>
                  <Input
                    value={formData.secondary_link_text}
                    onChange={(e) => setFormData({ ...formData, secondary_link_text: e.target.value })}
                    placeholder="Sužinoti daugiau"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rikiavimo eilė</Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label>Aktyvus baneris</Label>
                </div>
              </div>

              {/* Preview */}
              {formData.title && (
                <div className="mt-4">
                  <Label className="text-sm text-muted-foreground mb-2 block">Peržiūra:</Label>
                  <div 
                    className="rounded-xl p-6 text-white"
                    style={{ backgroundColor: formData.background_color }}
                  >
                    {formData.badge_text && (
                      <Badge className="mb-2 bg-white/20">{formData.badge_text}</Badge>
                    )}
                    <h3 className="text-xl font-bold">{formData.title}</h3>
                    {formData.subtitle && <p className="text-sm opacity-80 mt-1">{formData.subtitle}</p>}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Atšaukti
              </Button>
              <Button onClick={handleSave}>
                {editingBanner ? 'Atnaujinti' : 'Sukurti'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
