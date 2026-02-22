/**
 * Cached Brand service: cache full list (same as GET /api/brands). Invalidate on create/update/delete.
 */

import * as brandModel from "../models/brand";
import type { BrandRow } from "../models/brand";
import { CacheKeys, CachePrefixes } from "../cache/keys";
import {
  cacheGet,
  cacheSet,
  cacheInvalidateByPrefix,
  CACHE_TTL_LIST,
} from "../cache/service";

/**
 * Get full brands list: cache-aside. Same structure as GET /api/brands (array of BrandRow).
 */
export async function getBrandList(): Promise<BrandRow[]> {
  const key = CacheKeys.brand();
  const cached = await cacheGet<BrandRow[]>(key);
  if (cached) return cached;

  const list = await brandModel.find();
  await cacheSet(key, list, CACHE_TTL_LIST);
  return list;
}

/**
 * Create brand: insert in DB then invalidate brand list cache.
 */
export async function createBrand(data: Parameters<typeof brandModel.createBrand>[0]): Promise<BrandRow> {
  const row = await brandModel.createBrand(data);
  await cacheInvalidateByPrefix(CachePrefixes.brand);
  return row;
}

/**
 * Update brand: update in DB then invalidate brand list cache.
 */
export async function updateBrand(
  id: string,
  data: Parameters<typeof brandModel.updateBrand>[1]
): Promise<BrandRow | null> {
  const row = await brandModel.updateBrand(id, data);
  if (row) await cacheInvalidateByPrefix(CachePrefixes.brand);
  return row;
}

/**
 * Delete brand: delete in DB then invalidate brand list cache.
 */
export async function deleteBrand(id: string): Promise<boolean> {
  const deleted = await brandModel.deleteBrand(id);
  if (deleted) await cacheInvalidateByPrefix(CachePrefixes.brand);
  return deleted;
}
