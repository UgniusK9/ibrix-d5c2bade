import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowUpDown, Search, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface UserWithBalance {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  balance_eur: number;
  wallet_id: string | null;
}

export function CreditsUsersList() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch all users with their wallets
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          wallets (
            id,
            balance_eur
          )
        `)
        .order('email');

      if (error) throw error;

      const usersWithBalance: UserWithBalance[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        balance_eur: user.wallets?.[0]?.balance_eur || 0,
        wallet_id: user.wallets?.[0]?.id || null,
      }));

      setUsers(usersWithBalance);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lt-LT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Filter users by search
  const filteredUsers = users.filter(user => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(s) ||
      (user.first_name?.toLowerCase() || '').includes(s) ||
      (user.last_name?.toLowerCase() || '').includes(s)
    );
  });

  // Sort users by balance
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortDirection === 'desc') {
      return b.balance_eur - a.balance_eur;
    }
    return a.balance_eur - b.balance_eur;
  });

  const toggleSort = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Calculate totals
  const totalBalance = users.reduce((sum, u) => sum + u.balance_eur, 0);
  const usersWithCredits = users.filter(u => u.balance_eur > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Vartotojų su kreditais</span>
          </div>
          <p className="text-2xl font-bold">{usersWithCredits}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-green-600" />
            <span className="text-sm text-muted-foreground">Bendras balansas</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatPrice(totalBalance)}</p>
        </div>
        <div className="bg-gradient-to-br from-muted to-muted/50 border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Iš viso vartotojų</span>
          </div>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ieškoti pagal el. paštą ar vardą..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={toggleSort} className="gap-2">
          <ArrowUpDown className="w-4 h-4" />
          {sortDirection === 'desc' ? 'Didžiausi viršuje' : 'Mažiausi viršuje'}
        </Button>
      </div>

      {/* Users table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vartotojas</TableHead>
              <TableHead>El. paštas</TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={toggleSort} className="gap-1 -mr-2">
                  Balansas
                  <ArrowUpDown className="w-3 h-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  {search ? 'Nerasta vartotojų pagal paiešką' : 'Nėra vartotojų'}
                </TableCell>
              </TableRow>
            ) : (
              sortedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                      </div>
                      <div>
                        {user.first_name || user.last_name ? (
                          <p className="font-medium">{user.first_name} {user.last_name}</p>
                        ) : (
                          <p className="text-muted-foreground text-sm">Vardas nenustatytas</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user.email}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.balance_eur > 0 ? (
                      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                        {formatPrice(user.balance_eur)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">{formatPrice(0)}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
