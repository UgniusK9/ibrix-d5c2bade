import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  type?: 'website' | 'product' | 'article';
  image?: string;
  noindex?: boolean;
  // Product-specific
  product?: {
    name: string;
    price: number;
    currency?: string;
    availability?: 'InStock' | 'PreOrder' | 'OutOfStock';
    sku?: string;
    image?: string;
    description?: string;
  };
}

const SITE_NAME = 'IBRIX';
const SITE_URL = 'https://ibrix.lt';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_DESCRIPTION = 'IBRIX - Aukštos kokybės auto dalys ir varikliai. Pre-order sistema su depozitu. Pristatome visoje Lietuvoje.';

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  type = 'website',
  image = DEFAULT_IMAGE,
  noindex = false,
  product,
}: SEOHeadProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const fullCanonical = canonical ? `${SITE_URL}${canonical}` : undefined;

  // Product structured data (JSON-LD)
  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || description,
    image: product.image || image,
    sku: product.sku,
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
    },
  } : null;

  // Organization schema for homepage
  const orgSchema = type === 'website' && !product ? {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@ibrix.lt',
      contactType: 'customer service',
      availableLanguage: ['Lithuanian', 'English'],
    },
  } : null;

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      {fullCanonical && <meta property="og:url" content={fullCanonical} />}
      <meta property="og:locale" content="lt_LT" />
      
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
        </>
      )}
      
      {/* Structured Data */}
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
      {orgSchema && (
        <script type="application/ld+json">
          {JSON.stringify(orgSchema)}
        </script>
      )}
    </Helmet>
  );
}
