import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { ShopifyProduct, fetchProducts } from "@/lib/shopify";

export function ProductsSection() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const data = await fetchProducts(6);
      setProducts(data);
      setLoading(false);
    }
    loadProducts();
  }, []);

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-2">
              Varikliai
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Premium techninių konstruktorių modeliai, kurie atgauna garsias automobilių variklio architektūras
            </p>
          </div>
          
          <Button asChild variant="outline" className="w-fit">
            <Link to="/varikliai">
              Visi varikliai
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">
              Produktų dar nėra
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Parduotuvėje kol kas nėra produktų. Pridėkite pirmus variklio modelius 
              per Lovable chat – tiesiog pasakykite, ką norite parduoti!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
