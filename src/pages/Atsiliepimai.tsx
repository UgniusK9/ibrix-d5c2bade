import { useState, useEffect, useRef } from 'react';
import { Star, Upload, X, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/layout/PageLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  verified_purchase: boolean | null;
  created_at: string;
  image_url: string | null;
  admin_reply: string | null;
  admin_reply_at: string | null;
  product: {
    title: string;
    slug: string;
  } | null;
}

interface Product {
  id: string;
  title: string;
  slug: string;
}

export default function Atsiliepimai() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuth();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadReviews();
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          id,
          rating,
          title,
          content,
          verified_purchase,
          created_at,
          image_url,
          admin_reply,
          admin_reply_at,
          product:products(title, slug)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);

      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (e) {
      console.error('Failed to load reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, slug')
        .eq('status', 'active')
        .order('title');

      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      console.error('Failed to load products:', e);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Nuotrauka per didelė. Maksimalus dydis 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Turite būti prisijungę');
      return;
    }

    if (!selectedProductId) {
      toast.error('Pasirinkite produktą');
      return;
    }

    if (rating === 0) {
      toast.error('Pasirinkite įvertinimą');
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if present
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('review-images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      // Create review
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: selectedProductId,
          user_id: user.id,
          rating,
          title: title.trim() || null,
          content: content.trim() || null,
          image_url: imageUrl,
          verified_purchase: false,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Atsiliepimas išsiųstas patvirtinimui');
      
      // Reset form
      setShowForm(false);
      setSelectedProductId('');
      setRating(0);
      setTitle('');
      setContent('');
      setImageFile(null);
      setImagePreview(null);
    } catch (e: any) {
      console.error('Failed to submit review:', e);
      toast.error(e.message || 'Nepavyko išsiųsti atsiliepimo');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 transition-colors ${interactive ? 'cursor-pointer' : ''} ${
              star <= (interactive ? (hoverRating || rating) : rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          />
        ))}
      </div>
    );
  };

  const ratingDistribution = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <PageLayout>
      <SEOHead
        title="Klientų atsiliepimai | LEGO rinkiniai"
        description="Sužinokite, ką mūsų klientai sako apie LEGO rinkinius. Tikri atsiliepimai iš patvirtintų pirkėjų."
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Klientų atsiliepimai</h1>
          {user && !showForm && (
            <Button onClick={() => setShowForm(true)}>
              Rašyti atsiliepimą
            </Button>
          )}
        </div>

        {/* Review Form */}
        {user && showForm && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Naujas atsiliepimas</h2>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label>Produktas *</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pasirinkite produktą" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Įvertinimas *</Label>
                  <div className="mt-1">
                    {renderStars(rating, true)}
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Pavadinimas</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Trumpas atsiliepimo pavadinimas"
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Atsiliepimas</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Papasakokite apie savo patirtį..."
                    rows={4}
                    maxLength={1000}
                  />
                </div>

                <div>
                  <Label>Nuotrauka (neprivaloma)</Label>
                  <div className="mt-2">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                          onClick={removeImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Įkelti nuotrauką
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Siunčiama...' : 'Išsiųsti atsiliepimą'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Atšaukti
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {!user && (
          <Card className="mb-8">
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground">
                <a href="/auth" className="text-primary hover:underline">Prisijunkite</a>, kad galėtumėte parašyti atsiliepimą
              </p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Kol kas nėra atsiliepimų</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Summary sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold mb-2">{averageRating}</div>
                    <div className="flex justify-center mb-2">
                      {renderStars(Math.round(averageRating || 0))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {reviews.length} {reviews.length === 1 ? 'atsiliepimas' : 'atsiliepimai'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((r) => {
                      const count = ratingDistribution[r] || 0;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={r} className="flex items-center gap-2 text-sm">
                          <span className="w-3">{r}</span>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reviews list */}
            <div className="lg:col-span-3 space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {renderStars(review.rating)}
                          {review.verified_purchase && (
                            <Badge variant="secondary" className="text-xs">
                              Patvirtintas pirkėjas
                            </Badge>
                          )}
                        </div>
                        {review.title && (
                          <h3 className="font-semibold">{review.title}</h3>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(review.created_at), 'yyyy-MM-dd', { locale: lt })}
                      </span>
                    </div>

                    {review.content && (
                      <p className="text-muted-foreground mb-3">{review.content}</p>
                    )}

                    {review.image_url && (
                      <div className="mb-3">
                        <img
                          src={review.image_url}
                          alt="Atsiliepimo nuotrauka"
                          className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(review.image_url!, '_blank')}
                        />
                      </div>
                    )}

                    {review.product && (
                      <a
                        href={`/produktas/${review.product.slug}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {review.product.title}
                      </a>
                    )}

                    {review.admin_reply && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Atsakymas:</p>
                        <p className="text-sm text-muted-foreground">{review.admin_reply}</p>
                        {review.admin_reply_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(review.admin_reply_at), 'yyyy-MM-dd HH:mm', { locale: lt })}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
