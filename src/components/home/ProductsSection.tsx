import { Link } from "react-router-dom";
import { ArrowRight, Package, Clock, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockProducts, formatMockPrice } from "@/data/mockProducts";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

export function ProductsSection() {
  const addItem = useCartStore((state) => state.addItem);
  
  // Display first 6 products
  const displayProducts = mockProducts.slice(0, 6);

  const handleAddToCart = (product: typeof mockProducts[0], e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success("Pridėta į krepšelį", {
      description: product.title,
      position: "top-center",
    });
  };

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
              Filtruokite pagal tipą, sudėtingumą, detalių skaičių ir pristatymo statusą.
            </p>
          </div>
          
          <Button asChild variant="outline" className="w-fit h-10 px-5">
            <Link to="/varikliai">
              Peržiūrėti visus
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [&>*:last-child:nth-child(3n-1)]:lg:col-start-2 [&>*:last-child:nth-child(3n-2)]:lg:col-start-2">
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
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-9 w-9 p-0 hover:bg-accent/10 hover:text-accent"
                    onClick={(e) => handleAddToCart(product, e)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
