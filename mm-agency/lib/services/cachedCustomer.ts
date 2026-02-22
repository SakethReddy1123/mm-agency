/**
 * Cached Customer service: cache full list (same as GET /api/customers). Invalidate on create/update/delete.
 */

import * as customerModel from "../models/customer";
import type { CustomerRow } from "../models/customer";
import { CacheKeys, CachePrefixes } from "../cache/keys";
import {
  cacheGet,
  cacheSet,
  cacheInvalidateByPrefix,
  CACHE_TTL_LIST,
} from "../cache/service";

/**
 * Get full customers list: cache-aside. Same structure as GET /api/customers (array of CustomerRow).
 */
export async function getCustomerList(): Promise<CustomerRow[]> {
  const key = CacheKeys.customer();
  const cached = await cacheGet<CustomerRow[]>(key);
  if (cached) return cached;

  const list = await customerModel.listCustomers();
  await cacheSet(key, list, CACHE_TTL_LIST);
  return list;
}

/**
 * Create customer: insert in DB then invalidate customer list cache.
 */
export async function createCustomer(
  input: Parameters<typeof customerModel.createCustomer>[0]
): Promise<CustomerRow> {
  const row = await customerModel.createCustomer(input);
  await cacheInvalidateByPrefix(CachePrefixes.customer);
  return row;
}

/**
 * Update customer: update in DB then invalidate customer list cache.
 */
export async function updateCustomer(
  id: string,
  input: Parameters<typeof customerModel.updateCustomer>[1]
): Promise<CustomerRow | null> {
  const row = await customerModel.updateCustomer(id, input);
  if (row) await cacheInvalidateByPrefix(CachePrefixes.customer);
  return row;
}

/**
 * Delete customer: delete in DB then invalidate customer list cache.
 */
export async function deleteCustomer(id: string): Promise<boolean> {
  const deleted = await customerModel.deleteCustomer(id);
  if (deleted) await cacheInvalidateByPrefix(CachePrefixes.customer);
  return deleted;
}
