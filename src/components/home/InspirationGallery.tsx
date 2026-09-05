import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface GalleryItem {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
}

/** Photos come from the admin panel — catalogue shots cannot be reused here,
 *  the secondary ones carry a manufacturer watermark. */
export function InspirationGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("gallery_items")
      .select("id, image_url, title, subtitle, link_url")
      .eq("active", true)
      .order("sort_order")
      .limit(5)
      .then(({ data, error }) => {
        if (error) console.error("Failed to load gallery:", error);
        setItems(data || []);
        setLoaded(true);
      });
  }, []);

  // Render nothing until there are photos — an empty mosaic looks broken.
  if (!loaded || items.length === 0) return null;

  const [feature, ...rest] = items;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
            Kaip atrodo surinkti rinkiniai
          </h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            Tikros nuotraukos, ne gamintojo renderiai — pamatyk modelį prieš užsisakydamas.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 md:auto-rows-[220px]">
          {/* Feature tile — double width and height on desktop */}
          <GalleryTile
            item={feature}
            className="col-span-2 row-span-2 aspect-square md:aspect-auto"
            priority
          />

          {rest.map((item) => (
            <GalleryTile
              key={item.id}
              item={item}
              className="col-span-1 aspect-square md:aspect-auto"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryTile({
  item,
  className,
  priority = false,
}: {
  item: GalleryItem;
  className?: string;
  priority?: boolean;
}) {
  const inner = (
    <>
      <img
        src={item.image_url}
        alt={item.title || "Surinktas MOULD KING rinkinys"}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />

      {/* Scrim only where text sits, so the photo stays the subject */}
      {(item.title || item.subtitle) && (
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
      )}

      {(item.title || item.subtitle) && (
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
          {item.title && (
            <p className="font-heading font-bold text-white text-sm md:text-base leading-tight">
              {item.title}
            </p>
          )}
          {item.subtitle && (
            <p className="text-white/75 text-xs md:text-sm mt-1 line-clamp-1">
              {item.subtitle}
            </p>
          )}
        </div>
      )}

      {item.link_url && (
        <span
          aria-hidden="true"
          className="absolute bottom-3 right-3 md:bottom-4 md:right-4 w-9 h-9 rounded-full bg-white text-foreground shadow-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground"
        >
          <Plus className="w-5 h-5" />
        </span>
      )}
    </>
  );

  const shared = cn(
    "group relative overflow-hidden rounded-xl md:rounded-2xl bg-muted",
    className
  );

  if (!item.link_url) {
    return <div className={shared}>{inner}</div>;
  }

  const isExternal = /^https?:\/\//i.test(item.link_url);

  return isExternal ? (
    <a href={item.link_url} target="_blank" rel="noopener noreferrer" className={shared}>
      {inner}
    </a>
  ) : (
    <Link to={item.link_url} className={shared}>
      {inner}
    </Link>
  );
}
