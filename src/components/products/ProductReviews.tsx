import { useState } from 'react';
import { Star, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useProductReviews } from '@/hooks/useProductReviews';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';

interface ProductReviewsProps {
  productId: string;
  productTitle: string;
}

export function ProductReviews({ productId, productTitle }: ProductReviewsProps) {
  const { reviews, loading, averageRating, reviewCount, canReview, submitReview } = useProductReviews(productId);
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;

    setSubmitting(true);
    const success = await submitReview(rating, title, content);
    setSubmitting(false);

    if (success) {
      setShowForm(false);
      setRating(5);
      setTitle('');
      setContent('');
    }
  };

  const renderStars = (value: number, interactive = false, size = 'w-5 h-5') => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
          >
            <Star
              className={`${size} ${
                star <= (interactive ? (hoverRating || rating) : value)
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">{averageRating?.toFixed(1) || '—'}</div>
          <div>
            {averageRating && renderStars(averageRating)}
            <p className="text-sm text-muted-foreground mt-1">
              {reviewCount} {reviewCount === 1 ? 'atsiliepimas' : 'atsiliepimai'}
            </p>
          </div>
        </div>

        {canReview && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            Parašyti atsiliepimą
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-muted/50 rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-semibold">Jūsų atsiliepimas apie "{productTitle}"</h3>
          
          <div className="space-y-2">
            <Label>Įvertinimas</Label>
            {renderStars(rating, true, 'w-8 h-8')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-title">Antraštė</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Trumpa atsiliepimo antraštė..."
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-content">Atsiliepimas</Label>
            <Textarea
              id="review-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Papasakokite apie savo patirtį..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Siunčiama...' : 'Siųsti atsiliepimą'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Atšaukti
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Kraunama...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Šis produktas dar neturi atsiliepimų.
            {!user && ' Prisijunkite ir įsigykite produktą, kad galėtumėte palikti atsiliepimą.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating, false, 'w-4 h-4')}
                      {review.verified_purchase && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Patvirtintas pirkėjas
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), 'yyyy-MM-dd', { locale: lt })}
                    </p>
                  </div>
                </div>
              </div>

              {review.title && (
                <h4 className="font-medium">{review.title}</h4>
              )}

              {review.content && (
                <p className="text-muted-foreground">{review.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
