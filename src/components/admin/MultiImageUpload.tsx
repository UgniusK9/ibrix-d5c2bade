import { useState, useRef } from 'react';
import { Upload, X, Loader2, GripVertical, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  maxImages?: number;
}

export function MultiImageUpload({ 
  value = [], 
  onChange, 
  folder = 'products', 
  label = 'Nuotraukos',
  maxImages = 10,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      toast.error(`Maksimalus nuotraukų skaičius: ${maxImages}`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    // Validate all files
    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        toast.error('Pasirinkite tik nuotraukų failus');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Nuotrauka per didelė (max 5MB)');
        return;
      }
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('admin-uploads')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('admin-uploads')
          .getPublicUrl(data.path);

        newUrls.push(urlData.publicUrl);
      }

      onChange([...value, ...newUrls]);
      toast.success(`Įkelta ${newUrls.length} nuotrauka(-os)`);
    } catch (e: any) {
      console.error('Upload error:', e);
      toast.error(e.message || 'Nepavyko įkelti nuotraukų');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleAddUrl = () => {
    if (!newUrl.trim()) return;
    
    if (value.length >= maxImages) {
      toast.error(`Maksimalus nuotraukų skaičius: ${maxImages}`);
      return;
    }

    // Basic URL validation
    try {
      new URL(newUrl);
      onChange([...value, newUrl.trim()]);
      setNewUrl('');
      toast.success('Nuotrauka pridėta');
    } catch {
      toast.error('Neteisingas URL formatas');
    }
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newValue = [...value];
    const draggedItem = newValue[draggedIndex];
    newValue.splice(draggedIndex, 1);
    newValue.splice(index, 0, draggedItem);
    
    onChange(newValue);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label} ({value.length}/{maxImages})</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs h-6"
          onClick={() => setUrlMode(!urlMode)}
        >
          {urlMode ? 'Įkelti failą' : 'Pridėti URL'}
        </Button>
      </div>

      {/* URL Mode */}
      {urlMode && (
        <div className="flex gap-2">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
          />
          <Button type="button" size="sm" onClick={handleAddUrl}>
            Pridėti
          </Button>
        </div>
      )}

      {/* File Upload */}
      {!urlMode && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading || value.length >= maxImages}
          />
          
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || value.length >= maxImages}
            className="w-full h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Įkeliama...</span>
              </>
            ) : (
              <>
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Pasirinkti nuotraukas (galima kelias)
                </span>
              </>
            )}
          </button>
        </>
      )}

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group aspect-square rounded-lg border border-border overflow-hidden bg-muted cursor-move ${
                draggedIndex === index ? 'opacity-50 ring-2 ring-primary' : ''
              }`}
            >
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              
              {/* Drag Handle */}
              <div className="absolute top-1 left-1 p-1 bg-background/80 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3 text-muted-foreground" />
              </div>
              
              {/* Remove Button */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
              >
                <X className="w-3 h-3" />
              </Button>

              {/* Index Badge */}
              {index === 0 && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded">
                  Pagrindinė
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Vilkite nuotraukas, kad pakeistumėte jų tvarką. Pirmoji bus rodoma kaip pagrindinė.
      </p>
    </div>
  );
}
