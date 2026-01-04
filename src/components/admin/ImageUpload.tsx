import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

export function ImageUpload({ value, onChange, folder = 'general', label = 'Nuotrauka' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Pasirinkite nuotraukos failą');
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Nuotrauka per didelė (max 5MB)');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('admin-uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('admin-uploads')
        .getPublicUrl(data.path);

      onChange(urlData.publicUrl);
      toast.success('Nuotrauka įkelta');
    } catch (e: any) {
      console.error('Upload error:', e);
      toast.error(e.message || 'Nepavyko įkelti nuotraukos');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs h-6"
          onClick={() => setUrlMode(!urlMode)}
        >
          {urlMode ? 'Įkelti failą' : 'Įvesti URL'}
        </Button>
      </div>

      {urlMode ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
        />
      ) : (
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          
          {value ? (
            <div className="relative inline-block">
              <img
                src={value}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg border border-border"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Įkeliama...</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Pasirinkti nuotrauką</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {value && !urlMode && (
        <p className="text-xs text-muted-foreground truncate">{value}</p>
      )}
    </div>
  );
}
