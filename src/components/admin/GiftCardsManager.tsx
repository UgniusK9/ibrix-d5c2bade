import { useState, useEffect } from 'react';
import { Gift, Plus, Search, RefreshCw, Copy, Trash2, DollarSign, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GiftCard {
  id: string;
  code: string;
  initial_value_eur: number;
  current_balance_eur: number;
  status: string;
  purchased_by_email: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  personal_message: string | null;
  created_at: string;
  expires_at: string | null;
  redeemed_at: string | null;
}

export function GiftCardsManager() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCardValue, setNewCardValue] = useState<number>(25);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadGiftCards();
  }, []);

  const loadGiftCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGiftCards(data || []);
    } catch (e) {
      console.error('Failed to load gift cards:', e);
      toast.error('Nepavyko įkelti dovanų kuponų');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGiftCard = async () => {
    if (newCardValue < 5) {
      toast.error('Minimali suma: 5€');
      return;
    }
    
    setCreating(true);
    try {
      // Generate code using database function
      const { data: codeData, error: codeError } = await supabase.rpc('generate_gift_card_code');
      if (codeError) throw codeError;

      const { error } = await supabase
        .from('gift_cards')
        .insert({
          code: codeData,
          initial_value_eur: newCardValue,
          current_balance_eur: newCardValue,
          status: 'active',
          recipient_email: recipientEmail || null,
          recipient_name: recipientName || null,
          personal_message: personalMessage || null,
        });

      if (error) throw error;

      // Send email to recipient if email provided
      if (recipientEmail) {
        try {
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              type: 'gift_card',
              email: recipientEmail,
              recipientEmail: recipientEmail,
              recipientName: recipientName || 'Gerbiamas kliente',
              senderName: 'IBRIX Administratorius',
              amount: newCardValue,
              code: codeData,
              personalMessage: personalMessage || null,
            },
          });
          
          if (emailError) {
            console.error('Email function error:', emailError);
            toast.success(`Dovanų kuponas sukurtas: ${codeData} (el. laiškas neišsiųstas)`);
          } else {
            toast.success(`Dovanų kuponas sukurtas ir išsiųstas į ${recipientEmail}`);
          }
        } catch (emailErr) {
          console.error('Failed to send gift card email:', emailErr);
          toast.success(`Dovanų kuponas sukurtas: ${codeData} (el. laiškas neišsiųstas)`);
        }
      } else {
        toast.success(`Dovanų kuponas sukurtas: ${codeData}`);
      }
      
      setIsCreateOpen(false);
      setNewCardValue(25);
      setRecipientEmail('');
      setRecipientName('');
      setPersonalMessage('');
      loadGiftCards();
    } catch (e: any) {
      console.error('Failed to create gift card:', e);
      toast.error(e.message || 'Nepavyko sukurti kupono');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gift_cards')
        .update({ status: 'deactivated' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Kuponas deaktyvuotas');
      loadGiftCards();
    } catch (e) {
      toast.error('Nepavyko deaktyvuoti kupono');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Kodas nukopijuotas');
  };

  const filteredCards = giftCards.filter(card => {
    const matchesSearch = 
      card.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.purchased_by_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: giftCards.length,
    active: giftCards.filter(c => c.status === 'active').length,
    redeemed: giftCards.filter(c => c.status === 'redeemed').length,
    totalValue: giftCards.reduce((sum, c) => sum + c.initial_value_eur, 0),
    outstandingBalance: giftCards.filter(c => c.status === 'active' || c.status === 'redeemed')
      .reduce((sum, c) => sum + c.current_balance_eur, 0),
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('lt-LT');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/30">Aktyvus</Badge>;
      case 'redeemed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Panaudotas</Badge>;
      case 'deactivated':
        return <Badge className="bg-muted text-muted-foreground">Deaktyvuotas</Badge>;
      case 'expired':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Pasibaigęs</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Iš viso kuponų</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPrice(stats.totalValue)}</p>
                <p className="text-xs text-muted-foreground">Bendra vertė</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Aktyvūs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPrice(stats.outstandingBalance)}</p>
                <p className="text-xs text-muted-foreground">Nepanaudota</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ieškoti pagal kodą ar el. paštą..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statusas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Visi</SelectItem>
              <SelectItem value="active">Aktyvūs</SelectItem>
              <SelectItem value="redeemed">Panaudoti</SelectItem>
              <SelectItem value="deactivated">Deaktyvuoti</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadGiftCards}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Sukurti kuponą
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Naujas dovanų kuponas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Vertė (EUR) *</Label>
                  <div className="flex gap-2 mt-2">
                    {[10, 25, 50, 100].map(val => (
                      <Button 
                        key={val}
                        type="button"
                        variant={newCardValue === val ? 'default' : 'outline'}
                        onClick={() => setNewCardValue(val)}
                      >
                        {val}€
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    value={newCardValue}
                    onChange={(e) => setNewCardValue(Number(e.target.value))}
                    min={5}
                    max={1000}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Gavėjo el. paštas (neprivaloma)</Label>
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="gavejo@email.lt"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Gavėjo vardas (neprivaloma)</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Jonas"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Asmeninis pranešimas (neprivaloma)</Label>
                  <Input
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder="Su gimtadieniu!"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleCreateGiftCard} disabled={creating} className="w-full">
                  {creating ? 'Kuriama...' : 'Sukurti kuponą'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Gift Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Dovanų kuponai ({filteredCards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Kraunama...</div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Dovanų kuponų nerasta
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="py-3 px-2">Kodas</th>
                    <th className="py-3 px-2">Vertė</th>
                    <th className="py-3 px-2">Likutis</th>
                    <th className="py-3 px-2">Statusas</th>
                    <th className="py-3 px-2">Gavėjas</th>
                    <th className="py-3 px-2">Sukurta</th>
                    <th className="py-3 px-2 text-right">Veiksmai</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.map(card => (
                    <tr key={card.id} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {card.code}
                          </code>
                          <Button variant="ghost" size="icon" onClick={() => copyCode(card.code)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-medium">{formatPrice(card.initial_value_eur)}</td>
                      <td className="py-3 px-2">
                        <span className={card.current_balance_eur < card.initial_value_eur ? 'text-amber-600' : ''}>
                          {formatPrice(card.current_balance_eur)}
                        </span>
                      </td>
                      <td className="py-3 px-2">{getStatusBadge(card.status)}</td>
                      <td className="py-3 px-2 text-sm">
                        {card.recipient_email || card.recipient_name || '-'}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {formatDate(card.created_at)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {card.status === 'active' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeactivate(card.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}