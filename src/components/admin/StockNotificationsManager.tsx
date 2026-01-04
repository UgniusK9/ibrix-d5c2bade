import { useState, useEffect } from 'react';
import { Bell, Mail, Check, Trash2, RefreshCw, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';

interface StockNotification {
  id: string;
  email: string;
  product_id: string;
  status: string;
  created_at: string;
  notified_at: string | null;
  product?: {
    title: string;
    sku: string;
    stock_status: string;
  };
}

export function StockNotificationsManager() {
  const [notifications, setNotifications] = useState<StockNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_notifications')
        .select(`
          *,
          product:products(title, sku, stock_status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (e) {
      console.error('Failed to load notifications:', e);
      toast.error('Nepavyko užkrauti pranešimų');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsNotified = async (id: string) => {
    setSendingId(id);
    try {
      const { error } = await supabase
        .from('stock_notifications')
        .update({ 
          status: 'notified',
          notified_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Pažymėta kaip išsiųsta');
      loadNotifications();
    } catch (e) {
      toast.error('Nepavyko atnaujinti');
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from('stock_notifications')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast.success('Pranešimas ištrintas');
      loadNotifications();
    } catch (e) {
      toast.error('Nepavyko ištrinti');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredNotifications = notifications.filter(n => 
    n.email.toLowerCase().includes(search.toLowerCase()) ||
    n.product?.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.product?.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  const notifiedCount = notifications.filter(n => n.status === 'notified').length;

  // Group notifications by product for easier management
  const byProduct = filteredNotifications.reduce((acc, n) => {
    const key = n.product_id;
    if (!acc[key]) {
      acc[key] = {
        product: n.product,
        notifications: [],
      };
    }
    acc[key].notifications.push(n);
    return acc;
  }, {} as Record<string, { product: StockNotification['product']; notifications: StockNotification[] }>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Pranešimai apie sandėlį
          </h3>
          <p className="text-sm text-muted-foreground">
            Vartotojai, laukiantys prekių grįžimo į sandėlį
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Laukia: {pendingCount}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Išsiųsta: {notifiedCount}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadNotifications}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atnaujinti
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Ieškoti pagal el. paštą arba produktą..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(byProduct).length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nėra pranešimų užklausų</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byProduct).map(([productId, { product, notifications: productNotifications }]) => (
            <Card key={productId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{product?.title || 'Nežinomas produktas'}</span>
                    <span className="text-sm font-mono text-muted-foreground ml-2">
                      {product?.sku}
                    </span>
                  </div>
                  <Badge 
                    variant={product?.stock_status === 'in_stock' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {product?.stock_status === 'in_stock' ? 'Sandėlyje' : 
                     product?.stock_status === 'preorder' ? 'Pre-order' : 'Nėra'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>El. paštas</TableHead>
                      <TableHead>Užklausta</TableHead>
                      <TableHead>Būsena</TableHead>
                      <TableHead className="text-right">Veiksmai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productNotifications.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-medium">{n.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(n.created_at), 'yyyy-MM-dd HH:mm', { locale: lt })}
                        </TableCell>
                        <TableCell>
                          {n.status === 'pending' ? (
                            <Badge variant="outline" className="text-xs">Laukia</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Išsiųsta {n.notified_at && format(new Date(n.notified_at), 'MM-dd')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {n.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsNotified(n.id)}
                                disabled={sendingId === n.id}
                              >
                                {sendingId === n.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                <span className="ml-1 hidden sm:inline">Pažymėti</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(n.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ištrinti pranešimą?</AlertDialogTitle>
            <AlertDialogDescription>
              Šis veiksmas negrįžtamas. Vartotojas nebegaus pranešimo apie šią prekę.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Atšaukti</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Ištrinti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
