/**
 * Cache keys for list/table data only — same structure as API responses.
 * No per-entity keys; cache entire table (array) as returned by GET /api/brands, /api/products, /api/customers.
 */

const PREFIX = "mm";

export const CacheKeys = {
  /** GET /api/brands — full list of brands (array) */
  brand: () => `${PREFIX}:brand`,

  /** GET /api/products — full list of products (array). With no query. */
  product: () => `${PREFIX}:product`,
  /** GET /api/products?brandName=X — products filtered by brand name */
  productByBrand: (brandName: string) => `${PREFIX}:product:${brandName}`,

  /** GET /api/customers — full list of customers (array) */
  customer: () => `${PREFIX}:customer`,
} as const;

/** Prefixes for bulk invalidation (e.g. when any brand/product/customer changes). */
export const CachePrefixes = {
  brand: `${PREFIX}:brand`,
  product: `${PREFIX}:product`,
  customer: `${PREFIX}:customer`,
} as const;
