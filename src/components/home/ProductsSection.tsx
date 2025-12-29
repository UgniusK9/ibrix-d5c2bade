import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Package, Clock, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShopifyProduct, fetchProducts, formatPrice } from "@/lib/shopify";
import { mockProducts, formatMockPrice } from "@/data/mockProducts";

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

  // Use first 6 mock products if no Shopify products
  const displayProducts = products.length > 0 ? null : mockProducts.slice(0, 6);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-2 block">
              KOLEKCIJA
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Varikliai
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Rinkitės pagal tipą, sudėtingumą ir pristatymo statusą.
            </p>
          </div>
          
          <Button asChild variant="outline" className="w-fit h-10 px-5">
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
              <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse border border-border">
                <div className="aspect-square bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-muted rounded w-20" />
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-6 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 6).map((product, index) => {
              const { node } = product;
              const firstVariant = node.variants.edges[0]?.node;
              const image = node.images.edges[0]?.node;
              const price = node.priceRange.minVariantPrice;
              const isAvailable = firstVariant?.availableForSale ?? false;
              const isPreOrder = !isAvailable;

              return (
                <Link
                  key={node.id}
                  to={`/produktas/${node.handle}`}
                  className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-secondary/30 to-muted/20 overflow-hidden">
                    {image ? (
                      <img
                        src={image.url}
                        alt={image.altText || node.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                        <Package className="w-16 h-16" strokeWidth={1} />
                      </div>
                    )}
                    <Badge className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 ${isPreOrder ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"}`}>
                      {isPreOrder ? "PRE-ORDER" : "SANDĖLYJE"}
                    </Badge>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-muted-foreground font-mono mb-1.5">
                      ORB-ENG-{10168 + index}
                    </p>
                    <h3 className="font-heading font-semibold text-base mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {node.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        2899 det.
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {isPreOrder ? "→ 8-10 sav." : "1-2 d.d."}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-heading font-bold text-xl text-accent">
                        {formatPrice(price.amount, price.currencyCode)}
                      </p>
                      <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-accent/10 hover:text-accent">
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : displayProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProducts.map((product) => (
              <Link
                key={product.id}
                to={`/produktas/${product.handle}`}
                className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-premium-lg transition-all duration-300"
              >
                <div className="relative aspect-square bg-gradient-to-br from-secondary/30 to-muted/20 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <Badge className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 ${product.status === "pre-order" ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"}`}>
                    {product.status === "pre-order" ? "PRE-ORDER" : "SANDĖLYJE"}
                  </Badge>
                </div>
                <div className="p-5">
                  <p className="text-xs text-muted-foreground font-mono mb-1.5">
                    {product.sku}
                  </p>
                  <h3 className="font-heading font-semibold text-base mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      {product.detailsCount} det.
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {product.eta}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-heading font-bold text-xl text-accent">
                      {formatMockPrice(product.price, product.currency)}
                    </p>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-accent/10 hover:text-accent">
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
