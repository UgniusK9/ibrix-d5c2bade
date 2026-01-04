import { useState, useEffect } from 'react';
import { Star, Check, X, RefreshCw, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  verified_purchase: boolean;
  status: string;
  created_at: string;
  product?: { title: string };
  user?: { email: string };
}

export function ReviewsManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const loadReviews = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('product_reviews')
        .select(`
          *,
          product:products(title),
          user:users(email)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReviews(data || []);
    } catch (e) {
      console.error('Failed to load reviews:', e);
      toast.error('Nepavyko užkrauti atsiliepimų');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const updateStatus = async (reviewId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', reviewId);

      if (error) throw error;
      toast.success(status === 'approved' ? 'Atsiliepimas patvirtintas' : 'Atsiliepimas atmestas');
      loadReviews();
    } catch (e) {
      console.error('Failed to update review:', e);
      toast.error('Nepavyko atnaujinti atsiliepimo');
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      'pending': { label: 'Laukia', className: 'bg-yellow-500/10 text-yellow-600' },
      'approved': { label: 'Patvirtintas', className: 'bg-green-500/10 text-green-600' },
      'rejected': { label: 'Atmestas', className: 'bg-red-500/10 text-red-600' },
    };
    const c = config[status] || config['pending'];
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statusas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Visi</SelectItem>
              <SelectItem value="pending">Laukiantys</SelectItem>
              <SelectItem value="approved">Patvirtinti</SelectItem>
              <SelectItem value="rejected">Atmesti</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={loadReviews} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atnaujinti
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Kraunama...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">Nėra atsiliepimų</h2>
          <p className="text-muted-foreground">
            {statusFilter === 'pending' ? 'Nėra laukiančių atsiliepimų' : 'Nerasta atsiliepimų'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produktas</TableHead>
                <TableHead>Vartotojas</TableHead>
                <TableHead>Įvertinimas</TableHead>
                <TableHead>Turinys</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Statusas</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium max-w-[150px] truncate">
                    {review.product?.title || 'Nežinomas'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                    {review.user?.email || 'Nežinomas'}
                  </TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell className="max-w-[250px]">
                    {review.title && <p className="font-medium text-sm">{review.title}</p>}
                    {review.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.content}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(review.created_at), 'yyyy-MM-dd')}
                  </TableCell>
                  <TableCell>{getStatusBadge(review.status)}</TableCell>
                  <TableCell>
                    {review.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => updateStatus(review.id, 'approved')}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => updateStatus(review.id, 'rejected')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
