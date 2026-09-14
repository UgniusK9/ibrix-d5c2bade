import { useState, useEffect } from 'react';
import { Star, Check, X, RefreshCw, MessageSquare, Trash2, Reply, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  image_url: string | null;
  admin_reply: string | null;
  admin_reply_at: string | null;
  verified_purchase: boolean;
  status: string;
  created_at: string;
  product?: { title: string };
  user?: { email: string };
}

export function ReviewsManager() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  
  // Reply dialog
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Image preview
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

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
      toast.error(t('admReviews.revLoadError'));
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
      toast.success(status === 'approved' ? t('admReviews.revApproved') : t('admReviews.revRejected'));
      loadReviews();
    } catch (e) {
      console.error('Failed to update review:', e);
      toast.error(t('admReviews.revUpdateError'));
    }
  };

  const handleOpenReplyDialog = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.admin_reply || '');
    setReplyDialogOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!selectedReview) return;

    setReplying(true);
    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({
          admin_reply: replyText.trim() || null,
          admin_reply_at: replyText.trim() ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedReview.id);

      if (error) throw error;
      toast.success(t('admReviews.revReplySaved'));
      setReplyDialogOpen(false);
      loadReviews();
    } catch (e) {
      console.error('Failed to save reply:', e);
      toast.error(t('admReviews.revReplyError'));
    } finally {
      setReplying(false);
    }
  };

  const handleOpenDeleteDialog = (review: Review) => {
    setReviewToDelete(review);
    setDeleteDialogOpen(true);
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    setDeleting(true);
    try {
      // Delete image from storage if exists
      if (reviewToDelete.image_url) {
        const path = reviewToDelete.image_url.split('/review-images/')[1];
        if (path) {
          await supabase.storage.from('review-images').remove([path]);
        }
      }

      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', reviewToDelete.id);

      if (error) throw error;
      toast.success(t('admReviews.revDeleted'));
      setDeleteDialogOpen(false);
      loadReviews();
    } catch (e) {
      console.error('Failed to delete review:', e);
      toast.error(t('admReviews.revDeleteError'));
    } finally {
      setDeleting(false);
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
      'pending': { label: t('admProducts.photoWaiting'), className: 'bg-yellow-500/10 text-yellow-600' },
      'approved': { label: t('admRefunds.refApproved'), className: 'bg-green-500/10 text-green-600' },
      'rejected': { label: t('admRefunds.refDenied'), className: 'bg-red-500/10 text-red-600' },
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
              <SelectValue placeholder={t('admCommon.statusLabel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="pending">{t('admReviews.revPending')}</SelectItem>
              <SelectItem value="approved">{t('admReviews.revApprovedPlural')}</SelectItem>
              <SelectItem value="rejected">{t('admReviews.revRejectedPlural')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={loadReviews} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('admCommon.refresh')}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">{t('common.loading')}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">{t('admReviews.revEmpty')}</h2>
          <p className="text-muted-foreground">
            {statusFilter === 'pending' ? t('admReviews.revEmptyPending') : t('admReviews.revNoResults')}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admCommon.product')}</TableHead>
                <TableHead>{t('admCommon.user')}</TableHead>
                <TableHead>{t('admReviews.revRating')}</TableHead>
                <TableHead>{t('admContent.nlContent')}</TableHead>
                <TableHead>{t('admCommon.photoLabel')}</TableHead>
                <TableHead>{t('admCommon.date')}</TableHead>
                <TableHead>{t('admCommon.statusLabel')}</TableHead>
                <TableHead>{t('admCommon.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium max-w-[120px] truncate">
                    {review.product?.title || t('admReviews.revUnknown')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                    {review.user?.email || t('admReviews.revUnknown')}
                  </TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell className="max-w-[200px]">
                    {review.title && <p className="font-medium text-sm truncate">{review.title}</p>}
                    {review.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.content}</p>
                    )}
                    {review.admin_reply && (
                      <p className="text-xs text-primary mt-1">{t('admReviews.revReplied')}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {review.image_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPreviewImageUrl(review.image_url);
                          setImagePreviewOpen(true);
                        }}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(review.created_at), 'yyyy-MM-dd')}
                  </TableCell>
                  <TableCell>{getStatusBadge(review.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {review.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => updateStatus(review.id, 'approved')}
                            title={t('common.confirm')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => updateStatus(review.id, 'rejected')}
                            title={t('admRefunds.refReject')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenReplyDialog(review)}
                        title={t('admUsers.inqReply')}
                      >
                        <Reply className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleOpenDeleteDialog(review)}
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admReviews.revReplyTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReview && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-sm text-muted-foreground">
                    {selectedReview.user?.email}
                  </span>
                </div>
                {selectedReview.title && (
                  <p className="font-medium text-sm">{selectedReview.title}</p>
                )}
                {selectedReview.content && (
                  <p className="text-sm text-muted-foreground">{selectedReview.content}</p>
                )}
              </div>
            )}
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t('admReviews.revReplyPh')}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmitReply} disabled={replying}>
              {replying ? t('admCommon.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admReviews.revDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admReviews.revDeleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? t('admUsers.inqDeleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Dialog */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admReviews.revPhotoTitle')}</DialogTitle>
          </DialogHeader>
          {previewImageUrl && (
            <img
              src={previewImageUrl}
              alt={t('admReviews.revPhotoTitle')}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
