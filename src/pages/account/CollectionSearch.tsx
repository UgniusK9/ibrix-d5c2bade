import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, Package, Lock, Users } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getProductImage } from '@/hooks/useProducts';

interface CollectionItem {
  product_id: string;
  product_title: string;
  product_slug: string;
  product_images: string[];
  product_details_json: Record<string, unknown>;
  source: 'online' | 'offline';
  quantity: number;
  created_at: string;
}

export default function CollectionSearch() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<CollectionItem[]>([]);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      return;
    }

    setLoading(true);
    setSearched(true);
    setNotFound(false);
    setResults([]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-collection?username=${encodeURIComponent(searchQuery.trim())}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setNotFound(true);
        return;
      }

      if (!data.found || !data.items || data.items.length === 0) {
        setNotFound(true);
        return;
      }

      setResults(data.items);
    } catch (e) {
      console.error('Collection search error:', e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <PageLayout>
      <div className="container py-8 md:py-12 max-w-4xl">
        <Link 
          to="/account/my-builders" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Grįžti į mano kolekciją
        </Link>

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">
            Kolekcijų paieška
          </h1>
          <p className="text-muted-foreground">
            Raskite kitų konstruktorių mėgėjų kolekcijas pagal jų slapyvardį
          </p>
        </div>

        {/* Search Input */}
        <div className="flex gap-2 max-w-md mx-auto mb-8">
          <Input
            placeholder="Įveskite slapyvardį..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-center"
          />
          <Button 
            onClick={handleSearch}
            disabled={loading || searchQuery.trim().length < 3}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && searched && notFound && (
          <Card className="text-center py-12">
            <CardContent>
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg mb-2">
                Kolekcija nerasta arba privati
              </h3>
              <p className="text-muted-foreground">
                Šis vartotojas neturi viešos kolekcijos arba tokio slapyvardžio nėra.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-lg">
                {searchQuery} kolekcija
              </h2>
              <Badge variant="outline">{results.length} konstruktorių</Badge>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((item, index) => (
                <Link
                  key={`${item.product_id}-${index}`}
                  to={`/produktas/${item.product_slug}`}
                  className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-secondary/30 to-muted/20 overflow-hidden">
                    <img
                      src={getProductImage({ images: item.product_images || [] } as any)}
                      alt={item.product_title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge 
                        className={`text-xs font-semibold ${
                          item.source === 'online' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {item.source === 'online' ? 'E-parduotuvė' : 'Parduotuvė'}
                      </Badge>
                    </div>
                    {item.quantity > 1 && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-background text-foreground">
                          ×{item.quantity}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-heading font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {item.product_title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {item.product_details_json?.detailsCount && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          {item.product_details_json.detailsCount as number} det.
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Info Note */}
        {!searched && (
          <Card className="bg-muted/50">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Pastaba:</strong> Matomos tik tos kolekcijos, kurių savininkai įjungė viešą rodymą nustatymuose.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
