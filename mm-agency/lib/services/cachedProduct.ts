/**
 * Cached Product service: cache full list (same as GET /api/products). Invalidate on create/update/delete.
 */

import * as productModel from "../models/product";
import type { ProductRow, ProductWithBrandRow } from "../models/product";
import { CacheKeys, CachePrefixes } from "../cache/keys";
import {
  cacheGet,
  cacheSet,
  cacheInvalidateByPrefix,
  CACHE_TTL_LIST,
} from "../cache/service";

export type ListProductsOptions = { brandName?: string };

/**
 * Get product list: cache-aside. Same structure as GET /api/products (array of ProductWithBrandRow).
 * Key: full list when no brandName; filtered list when brandName provided.
 */
export async function getProductList(
  options?: ListProductsOptions
): Promise<ProductWithBrandRow[]> {
  const brandName = options?.brandName?.trim();
  const key = brandName
    ? CacheKeys.productByBrand(brandName)
    : CacheKeys.product();
  const cached = await cacheGet<ProductWithBrandRow[]>(key);
  if (cached) return cached;

  const list = await productModel.listProducts({ brandName: brandName ?? undefined });
  await cacheSet(key, list, CACHE_TTL_LIST);
  return list;
}

/**
 * Create product: insert in DB then invalidate all product list caches.
 */
export async function createProduct(
  input: Parameters<typeof productModel.createProduct>[0]
): Promise<ProductRow> {
  const row = await productModel.createProduct(input);
  await cacheInvalidateByPrefix(CachePrefixes.product);
  return row;
}

/**
 * Update product: update in DB then invalidate all product list caches.
 */
export async function updateProduct(
  id: string,
  input: Parameters<typeof productModel.updateProduct>[1]
): Promise<ProductRow | null> {
  const row = await productModel.updateProduct(id, input);
  if (row) await cacheInvalidateByPrefix(CachePrefixes.product);
  return row;
}

/**
 * Delete product: delete in DB then invalidate all product list caches.
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const deleted = await productModel.deleteProduct(id);
  if (deleted) await cacheInvalidateByPrefix(CachePrefixes.product);
  return deleted;
}
