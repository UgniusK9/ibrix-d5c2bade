import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Logs a product view to the product_views table.
 * Fires once per product_id per component mount (deduped via ref).
 */
export function useTrackProductView(productId: string | undefined | null) {
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    if (trackedRef.current === productId) return;
    trackedRef.current = productId;

    const sessionId =
      typeof window !== "undefined"
        ? localStorage.getItem("ibrix_anonymous_id") || crypto.randomUUID()
        : null;

    if (sessionId && typeof window !== "undefined" && !localStorage.getItem("ibrix_anonymous_id")) {
      localStorage.setItem("ibrix_anonymous_id", sessionId);
    }

    supabase.functions
      .invoke("track-product-view", {
        body: {
          product_id: productId,
          session_id: sessionId,
          referrer: typeof document !== "undefined" ? document.referrer : null,
        },
      })
      .catch((e) => console.warn("[useTrackProductView] failed:", e));
  }, [productId]);
}
