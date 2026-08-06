import { useLocation } from 'react-router-dom';
import { SEOHead } from './SEOHead';
import seoPages from '@/config/seoPages.json';

interface SeoPage {
  loc: string;
  title: string;
  desc: string;
}

const PAGES = seoPages.pages as SeoPage[];

interface RouteSEOProps {
  /** Override the looked-up path. Defaults to the current location. */
  path?: string;
  /** Mark the route noindex — for private/transactional pages. */
  noindex?: boolean;
  /** Fallback title when the route has no entry in seoPages.json. */
  title?: string;
  description?: string;
}

/**
 * Renders per-route meta tags from the shared seoPages.json config.
 *
 * Static routes are already prerendered into dist/<route>/index.html by
 * scripts/prerender-static.mjs, which is what social crawlers and the initial
 * page load see. This component covers the other half: client-side navigation,
 * where no document reload happens and the head would otherwise keep whatever
 * the previously rendered route left behind — including a stale <title>, which
 * GA4 reports as page_title.
 *
 * Reading the same JSON as the prerender script keeps the two in sync.
 */
export function RouteSEO({ path, noindex, title, description }: RouteSEOProps) {
  const location = useLocation();
  const key = path ?? location.pathname;
  const page = PAGES.find((p) => p.loc === key);

  const resolvedTitle = page?.title ?? title;
  if (!resolvedTitle) return null;

  return (
    <SEOHead
      title={resolvedTitle}
      description={page?.desc ?? description}
      canonical={page?.loc ?? key}
      noindex={noindex}
    />
  );
}
