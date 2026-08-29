import { Helmet } from 'react-helmet-async';
import { COMPANY } from '@/config/company';

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  type?: 'website' | 'product' | 'article';
  image?: string;
  noindex?: boolean;
  product?: {
    name: string;
    price: number;
    currency?: string;
    availability?: 'InStock' | 'PreOrder' | 'OutOfStock';
    sku?: string;
    image?: string;
    description?: string;
  };
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const SITE_NAME = 'IBRIX';
const SITE_URL = 'https://ibrix.lt';
// Manufacturer brand — keep in sync with product-feed, kaina24-feed and
// scripts/prerender-products.mjs, which all declare MOULD KING.
const BRAND = 'MOULD KING';
// Must match the og:image in index.html so crawler-visible and app-rendered
// tags agree. Self-hosted; regenerate with scripts/generate-og-image.mjs.
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_DESCRIPTION = 'IBRIX - Aukštos kokybės variklių ir mechaninių modelių parduotuvė Lietuvoje. Pre-order sistema, nemokamas pristatymas, 14 dienų grąžinimas.';

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  type = 'website',
  image = DEFAULT_IMAGE,
  noindex = false,
  product,
  breadcrumbs,
}: SEOHeadProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const fullCanonical = canonical ? `${SITE_URL}${canonical}` : undefined;

  // Product structured data (JSON-LD) - no fake aggregateRating
  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || description,
    image: product.image || image,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: BRAND,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'EUR',
      availability: product.availability === 'PreOrder' 
        ? 'https://schema.org/PreOrder'
        : product.availability === 'OutOfStock'
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
      url: fullCanonical,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  } : null;

  // Breadcrumb schema
  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  } : null;

  // Organization schema for homepage
  const orgSchema = type === 'website' && !product ? {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_IMAGE,
    sameAs: [COMPANY.social.facebook, COMPANY.social.tiktok],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@ibrix.lt',
      contactType: 'customer service',
      availableLanguage: ['Lithuanian', 'English'],
    },
  } : null;

  // LocalBusiness schema
  const localBusinessSchema = type === 'website' && !product ? {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: SITE_NAME,
    url: SITE_URL,
    priceRange: '€€',
    paymentAccepted: 'Credit Card, Debit Card, Bank Transfer',
    currenciesAccepted: 'EUR',
  } : null;

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}
      
      {/* Language */}
      <html lang="lt" />
      <meta property="og:locale" content="lt_LT" />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      {fullCanonical && <meta property="og:url" content={fullCanonical} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Product-specific Open Graph */}
      {product && (
        <>
          <meta property="product:price:amount" content={product.price.toString()} />
          <meta property="product:price:currency" content={product.currency || 'EUR'} />
          <meta property="product:availability" content={product.availability === 'InStock' ? 'in stock' : product.availability === 'PreOrder' ? 'preorder' : 'out of stock'} />
        </>
      )}
      
      {/* Additional SEO meta tags */}
      <meta name="author" content={SITE_NAME} />
      <meta name="publisher" content={SITE_NAME} />
      <meta name="copyright" content={`© ${new Date().getFullYear()} ${SITE_NAME}`} />
      <meta name="theme-color" content="#1E4ED8" />
      
      {/* Structured Data */}
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
      {orgSchema && (
        <script type="application/ld+json">
          {JSON.stringify(orgSchema)}
        </script>
      )}
      {localBusinessSchema && (
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      )}
    </Helmet>
  );
}
