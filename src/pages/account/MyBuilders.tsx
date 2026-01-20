import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, Package, Search, Plus, 
  ShoppingBag, Store, Puzzle, ChevronRight, Sparkles
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice, getProductImage } from '@/hooks/useProducts';

interface BuilderItem {
  id: string;
  product_id: string;
  source: 'online' | 'offline';
  serial: string | null;
  quantity: number;
  created_at: string;
  product: {
    title: string;
    slug: string;
    images: string[];
    details_json: Record<string, unknown>;
    price_eur: number;
  } | null;
}

export default function MyBuilders() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [builders, setBuilders] = useState<BuilderItem[]>([]);
  const [serialInput, setSerialInput] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadBuilders();
  }, [user]);

  const loadBuilders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_builders')
        .select(`
          id,
          product_id,
          source,
          serial,
          quantity,
          created_at,
          product:products (
            title,
            slug,
            images,
            details_json,
            price_eur
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBuilders((data as unknown as BuilderItem[]) || []);
    } catch (e) {
      console.error('Error loading builders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSerial = async () => {
    if (!serialInput.trim()) {
      toast.error('Įveskite serijinį numerį');
      return;
    }

    setRegistering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Prisijunkite iš naujo');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-serial`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ serial: serialInput.trim() }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Registracijos klaida');
        return;
      }

      toast.success(result.message || 'Konstruktorius užregistruotas!');
      setSerialInput('');
      loadBuilders();
    } catch (e) {
      console.error('Serial registration error:', e);
      toast.error('Registracijos klaida');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-8 md:py-12 max-w-6xl">
        <Link 
          to="/account" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('settings.backToAccount')}
        </Link>

        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">
            Mano kolekcija
          </h1>
          <p className="text-muted-foreground">
            Jūsų surinkti konstruktoriai vienoje vietoje
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{builders.length}</p>
              <p className="text-sm text-muted-foreground">Konstruktorių</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">
                {builders.filter(b => b.source === 'online').length}
              </p>
              <p className="text-sm text-muted-foreground">Iš e-parduotuvės</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">
                {builders.filter(b => b.source === 'offline').length}
              </p>
              <p className="text-sm text-muted-foreground">Iš parduotuvių</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">
                {builders.reduce((sum, b) => sum + (b.product?.details_json?.detailsCount as number || 0) * b.quantity, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Detalių iš viso</p>
            </CardContent>
          </Card>
        </div>

        {/* Register Serial CTA */}
        <Card className="mb-8 border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="w-5 h-5 text-primary" />
                  <h3 className="font-heading font-semibold text-lg">
                    Pirkote parduotuvėje?
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Užregistruokite savo konstruktorių įvesdami serijinį numerį iš dėžės
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Pvz. IBRIX-2024-XXXXX"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                    className="max-w-xs"
                  />
                  <Button 
                    onClick={handleRegisterSerial}
                    disabled={registering || !serialInput.trim()}
                  >
                    {registering ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline ml-2">Registruoti</span>
                  </Button>
                </div>
              </div>
              <div className="hidden md:block w-px h-20 bg-border" />
              <div className="text-center md:text-left">
                <Link 
                  to="/account/collection-search" 
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Search className="w-4 h-4" />
                  Ieškoti kitų kolekcijų
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Register Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-primary" />
              Kaip užregistruoti?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-primary">1</span>
                </div>
                <h4 className="font-semibold mb-1">Raskite serijinį numerį</h4>
                <p className="text-sm text-muted-foreground">
                  Numeris yra ant dėžės arba instrukcijos
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-primary">2</span>
                </div>
                <h4 className="font-semibold mb-1">Įveskite kodą</h4>
                <p className="text-sm text-muted-foreground">
                  Užpildykite formą viršuje
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-primary">3</span>
                </div>
                <h4 className="font-semibold mb-1">Mėgaukitės!</h4>
                <p className="text-sm text-muted-foreground">
                  Konstruktorius atsiras jūsų kolekcijoje
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Builders Grid */}
        {builders.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {builders.map((builder) => (
              <Link
                key={builder.id}
                to={builder.product?.slug ? `/produktas/${builder.product.slug}` : '#'}
                className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gradient-to-br from-secondary/30 to-muted/20 overflow-hidden">
                  <img
                    src={getProductImage({ images: builder.product?.images || [] } as any)}
                    alt={builder.product?.title || 'Konstruktorius'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Source Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge 
                      className={`text-xs font-semibold ${
                        builder.source === 'online' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {builder.source === 'online' ? (
                        <><ShoppingBag className="w-3 h-3 mr-1" /> E-parduotuvė</>
                      ) : (
                        <><Store className="w-3 h-3 mr-1" /> Parduotuvė</>
                      )}
                    </Badge>
                  </div>
                  {builder.quantity > 1 && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-background text-foreground">
                        ×{builder.quantity}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-heading font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {builder.product?.title || 'Nežinomas produktas'}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {builder.product?.details_json?.detailsCount && (
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        {builder.product.details_json.detailsCount as number} det.
                      </span>
                    )}
                    {builder.serial && (
                      <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        {builder.serial}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg mb-2">
                Jūsų kolekcija tuščia
              </h3>
              <p className="text-muted-foreground mb-6">
                Pirkite konstruktorius arba užregistruokite jau turimus
              </p>
              <div className="flex justify-center gap-3">
                <Button asChild>
                  <Link to="/produktai/visi">Naršyti konstruktorius</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Browse More CTA */}
        {builders.length > 0 && (
          <div className="mt-12 text-center">
            <h3 className="font-heading font-semibold text-lg mb-4">
              Plėsk savo kolekciją!
            </h3>
            <Button asChild size="lg">
              <Link to="/produktai/visi">
                Naršyti konstruktorius
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
