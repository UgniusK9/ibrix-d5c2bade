import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag, RefreshCw, ChevronDown, Users, Gift, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Database } from '@/integrations/supabase/types';

type OfferType = Database['public']['Enums']['offer_type'];
type SegmentKey = Database['public']['Enums']['segment_key'];

interface Offer {
  id: string;
  title: string;
  description: string | null;
  code: string;
  type: OfferType;
  value: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  redemptions_count?: number;
  targets_count?: number;
}

interface OfferFormData {
  title: string;
  description: string;
  code: string;
  type: OfferType;
  value: string;
  active: boolean;
  starts_at: string;
  ends_at: string;
}

interface User {
  id: string;
  email: string;
}

const emptyFormData: OfferFormData = {
  title: '',
  description: '',
  code: '',
  type: 'percent',
  value: '',
  active: true,
  starts_at: '',
  ends_at: '',
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export function OffersManager() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState<OfferFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  
  // Assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningOffer, setAssigningOffer] = useState<Offer | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedSegment, setSelectedSegment] = useState<SegmentKey | ''>('');

  const loadOffers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin', {
        body: { action: 'list_offers' }
      });

      if (error) throw error;
      if (data?.offers) {
        setOffers(data.offers);
      }
    } catch (e: any) {
      console.error('Failed to load offers:', e);
      toast.error('Nepavyko užkrauti pasiūlymų');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin', {
        body: { action: 'list_users' }
      });

      if (error) throw error;
      if (data?.users) {
        setUsers(data.users);
      }
    } catch (e: any) {
      console.error('Failed to load users:', e);
    }
  };

  useEffect(() => {
    loadOffers();
    loadUsers();
  }, []);

  const openCreateForm = () => {
    setEditingOffer(null);
    setFormData({
      ...emptyFormData,
      code: generateCode()
    });
    setFormOpen(true);
  };

  const generateCode = () => {
    return 'IBRIX' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const openEditForm = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description || '',
      code: offer.code,
      type: offer.type,
      value: offer.value.toString(),
      active: offer.active,
      starts_at: offer.starts_at ? offer.starts_at.split('T')[0] : '',
      ends_at: offer.ends_at ? offer.ends_at.split('T')[0] : '',
    });
    setFormOpen(true);
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Pavadinimas yra privalomas';
    if (!formData.code.trim()) return 'Kodas yra privalomas';
    
    const value = parseFloat(formData.value);
    if (isNaN(value) || value <= 0) return 'Reikšmė turi būti didesnė nei 0';
    
    if (formData.type === 'percent' && value > 100) {
      return 'Procentinė nuolaida negali viršyti 100%';
    }
    
    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      const offerData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        active: formData.active,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
      };

      const { data, error } = await supabase.functions.invoke('admin', {
        body: {
          action: editingOffer ? 'update_offer' : 'create_offer',
          ...(editingOffer ? { offerId: editingOffer.id } : {}),
          ...offerData
        }
      });

      if (error) throw error;
      
      toast.success(editingOffer ? 'Pasiūlymas atnaujintas' : 'Pasiūlymas sukurtas');
      setFormOpen(false);
      loadOffers();
    } catch (e: any) {
      console.error('Failed to save offer:', e);
      toast.error(e.message || 'Nepavyko išsaugoti pasiūlymo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!offerToDelete) return;
    
    try {
      const { error } = await supabase.functions.invoke('admin', {
        body: { action: 'delete_offer', offerId: offerToDelete.id }
      });

      if (error) throw error;
      
      toast.success('Pasiūlymas ištrintas');
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
      loadOffers();
    } catch (e: any) {
      console.error('Failed to delete offer:', e);
      toast.error(e.message || 'Nepavyko ištrinti pasiūlymo');
    }
  };

  const handleAssign = async () => {
    if (!assigningOffer || (!selectedUserId && !selectedSegment)) {
      toast.error('Pasirinkite vartotoją arba segmentą');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin', {
        body: { 
          action: 'assign_offer', 
          offerId: assigningOffer.id,
          userId: selectedUserId || null,
          segmentKey: selectedSegment || null,
        }
      });

      if (error) throw error;
      
      toast.success('Pasiūlymas priskirtas');
      setAssignDialogOpen(false);
      setAssigningOffer(null);
      setSelectedUserId('');
      setSelectedSegment('');
      loadOffers();
    } catch (e: any) {
      console.error('Failed to assign offer:', e);
      toast.error(e.message || 'Nepavyko priskirti pasiūlymo');
    }
  };

  const filteredOffers = offers.filter(o => {
    if (search) {
      const s = search.toLowerCase();
      return o.title.toLowerCase().includes(s) || 
             o.code.toLowerCase().includes(s);
    }
    return true;
  });

  const formatValue = (offer: Offer) => {
    if (offer.type === 'percent') {
      return `-${offer.value}%`;
    }
    return `-${formatPrice(offer.value)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ieškoti..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={loadOffers} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atnaujinti
          </Button>
          <Button onClick={openCreateForm}>
            <Plus className="w-4 h-4 mr-2" />
            Naujas pasiūlymas
          </Button>
        </div>
      </div>

      {/* Offers table */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Kraunama...</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">
            {offers.length === 0 ? 'Nėra pasiūlymų' : 'Nerasta pasiūlymų'}
          </h2>
          <p className="text-muted-foreground">
            {offers.length === 0 
              ? 'Sukurkite pirmą pasiūlymą spaudžiant "Naujas pasiūlymas"' 
              : 'Pabandykite pakeisti paiešką'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pasiūlymas</TableHead>
                <TableHead>Kodas</TableHead>
                <TableHead>Nuolaida</TableHead>
                <TableHead>Statusas</TableHead>
                <TableHead>Galioja</TableHead>
                <TableHead>Panaudota</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{offer.title}</p>
                      {offer.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-48">
                          {offer.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-sm">{offer.code}</code>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-primary text-primary-foreground">
                      {formatValue(offer)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={offer.active ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}>
                      {offer.active ? 'Aktyvus' : 'Neaktyvus'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {offer.starts_at || offer.ends_at ? (
                      <div>
                        {offer.starts_at && <p>Nuo: {new Date(offer.starts_at).toLocaleDateString('lt-LT')}</p>}
                        {offer.ends_at && <p>Iki: {new Date(offer.ends_at).toLocaleDateString('lt-LT')}</p>}
                      </div>
                    ) : (
                      'Neribotas'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Gift className="w-4 h-4 text-muted-foreground" />
                      {offer.redemptions_count || 0}
                      {offer.targets_count && offer.targets_count > 0 && (
                        <>
                          <span className="text-muted-foreground">/</span>
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {offer.targets_count}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditForm(offer)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Redaguoti
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setAssigningOffer(offer); setAssignDialogOpen(true); }}>
                          <Users className="w-4 h-4 mr-2" />
                          Priskirti
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => { setOfferToDelete(offer); setDeleteDialogOpen(true); }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Ištrinti
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingOffer ? 'Redaguoti pasiūlymą' : 'Naujas pasiūlymas'}
            </DialogTitle>
            <DialogDescription>
              {editingOffer ? `Redaguojamas: ${editingOffer.title}` : 'Sukurkite naują nuolaidos pasiūlymą'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Pavadinimas *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Vasaros nuolaida"
              />
            </div>

            <div>
              <Label htmlFor="description">Aprašymas</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Specialus pasiūlymas..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Kodas *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER20"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, code: generateCode() }))}
                >
                  Generuoti
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipas</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as OfferType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Procentai (%)</SelectItem>
                    <SelectItem value="fixed">Fiksuota suma (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Reikšmė *</Label>
                <Input
                  id="value"
                  type="number"
                  step={formData.type === 'percent' ? '1' : '0.01'}
                  min="0"
                  max={formData.type === 'percent' ? '100' : undefined}
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={formData.type === 'percent' ? '20' : '10.00'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="starts_at">Galioja nuo</Label>
                <Input
                  id="starts_at"
                  type="date"
                  value={formData.starts_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="ends_at">Galioja iki</Label>
                <Input
                  id="ends_at"
                  type="date"
                  value={formData.ends_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Aktyvus</Label>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Atšaukti
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saugoma...
                </>
              ) : (
                editingOffer ? 'Atnaujinti' : 'Sukurti'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Priskirti pasiūlymą</DialogTitle>
            <DialogDescription>
              Priskirti "{assigningOffer?.title}" vartotojui arba segmentui
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Vartotojas</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pasirinkti vartotoją..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center text-sm text-muted-foreground">arba</div>

            <div>
              <Label>Segmentas</Label>
              <Select value={selectedSegment} onValueChange={(v) => setSelectedSegment(v as SegmentKey)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pasirinkti segmentą..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CART_ABANDONER">Nebaigę pirkimo</SelectItem>
                  <SelectItem value="HIGH_INTENT">Aukštas susidomėjimas</SelectItem>
                  <SelectItem value="RETURNING">Grįžtantys</SelectItem>
                  <SelectItem value="NEW_USER">Nauji vartotojai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Atšaukti
            </Button>
            <Button onClick={handleAssign}>
              Priskirti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ištrinti pasiūlymą?</AlertDialogTitle>
            <AlertDialogDescription>
              Ar tikrai norite ištrinti "{offerToDelete?.title}"? 
              Šis veiksmas negrįžtamas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Atšaukti</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ištrinti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
