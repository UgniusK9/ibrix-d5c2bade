import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ImageUpload } from './ImageUpload';
import { useTranslation } from 'react-i18next';

interface GalleryItem {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

const EMPTY = {
  image_url: '',
  title: '',
  subtitle: '',
  link_url: '',
  sort_order: 0,
  active: true,
};

export function GalleryManager() {
  const { t } = useTranslation();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [formData, setFormData] = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error('Gallery load error:', e);
      toast.error(t('admContent.galleryLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setFormData({ ...EMPTY, sort_order: items.length });
    setShowDialog(true);
  };

  const openEdit = (item: GalleryItem) => {
    setEditing(item);
    setFormData({
      image_url: item.image_url,
      title: item.title || '',
      subtitle: item.subtitle || '',
      link_url: item.link_url || '',
      sort_order: item.sort_order,
      active: item.active,
    });
    setShowDialog(true);
  };

  const save = async () => {
    if (!formData.image_url) {
      toast.error(t('admContent.galleryUploadFirst'));
      return;
    }
    const payload = {
      image_url: formData.image_url,
      title: formData.title || null,
      subtitle: formData.subtitle || null,
      link_url: formData.link_url || null,
      sort_order: formData.sort_order,
      active: formData.active,
      updated_at: new Date().toISOString(),
    };
    try {
      const { error } = editing
        ? await supabase.from('gallery_items').update(payload).eq('id', editing.id)
        : await supabase.from('gallery_items').insert(payload);
      if (error) throw error;
      toast.success(editing ? t('admContent.galleryUpdated') : t('admContent.galleryAdded'));
      setShowDialog(false);
      load();
    } catch (e) {
      console.error('Gallery save error:', e);
      toast.error(t('admCommon.saveFailed'));
    }
  };

  const remove = async (item: GalleryItem) => {
    if (!confirm(t('admContent.galleryDeleteConfirm'))) return;
    try {
      const { error } = await supabase.from('gallery_items').delete().eq('id', item.id);
      if (error) throw error;
      toast.success(t('admContent.galleryDeleted'));
      load();
    } catch (e) {
      console.error('Gallery delete error:', e);
      toast.error(t('admCommon.deleteFailed'));
    }
  };

  const toggleActive = async (item: GalleryItem) => {
    try {
      const { error } = await supabase
        .from('gallery_items')
        .update({ active: !item.active, updated_at: new Date().toISOString() })
        .eq('id', item.id);
      if (error) throw error;
      load();
    } catch (e) {
      console.error('Gallery toggle error:', e);
      toast.error(t('admContent.galleryToggleError'));
    }
  };

  // Swap sort_order with the neighbour so the owner can reorder without typing numbers.
  const move = async (index: number, dir: -1 | 1) => {
    const target = items[index + dir];
    const current = items[index];
    if (!target) return;
    try {
      await supabase.from('gallery_items').update({ sort_order: target.sort_order }).eq('id', current.id);
      await supabase.from('gallery_items').update({ sort_order: current.sort_order }).eq('id', target.id);
      load();
    } catch (e) {
      console.error('Gallery reorder error:', e);
      toast.error(t('admContent.galleryMoveError'));
    }
  };

  const visible = items.filter((i) => i.active).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>{t('admContent.galleryTitle')}</CardTitle>
            <CardDescription>
              {t('admContent.galleryDesc')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" />
              {t('common.add')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {visible === 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            {t('admContent.galleryNoActive')}
          </p>
        )}

        {items.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t('admContent.galleryEmpty')}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border border-border rounded-lg p-2"
              >
                <img
                  src={item.image_url}
                  alt=""
                  className="w-20 h-16 object-cover rounded-md bg-muted flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{item.title || t('admContent.galleryUntitled')}</span>
                    {i === 0 && item.active && <Badge variant="secondary">{t('admContent.galleryBig')}</Badge>}
                    {!item.active && <Badge variant="outline">{t('admContent.galleryHidden')}</Badge>}
                    {i >= 5 && <Badge variant="outline">{t('admContent.galleryOverLimit')}</Badge>}
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  )}
                  {item.link_url && (
                    <p className="text-xs text-muted-foreground truncate">→ {item.link_url}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(item)}>
                    {item.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(item)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('admContent.galleryEdit') : t('admContent.galleryAdd')}</DialogTitle>
            <DialogDescription>
              {t('admContent.galleryHint')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              folder="galerija"
              label={t('admCommon.photoLabel')}
            />

            <div>
              <Label htmlFor="g-title">{t('admCommon.name')}</Label>
              <Input
                id="g-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('admContent.galleryTitlePh')}
              />
            </div>

            <div>
              <Label htmlFor="g-subtitle">{t('admContent.galleryCaption')}</Label>
              <Input
                id="g-subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder={t('admContent.gallerySubtitlePh')}
              />
            </div>

            <div>
              <Label htmlFor="g-link">{t('admContent.galleryLink')}</Label>
              <Input
                id="g-link"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="/produktas/24130-red-rose-babys-breath-bouquet-building-set"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('admContent.galleryLinkHint')}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="g-active">{t('admContent.galleryVisible')}</Label>
              <Switch
                id="g-active"
                checked={formData.active}
                onCheckedChange={(v) => setFormData({ ...formData, active: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={save}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
