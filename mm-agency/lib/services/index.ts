/**
 * Cached services: list cache only (same structure as GET /api/brands, /api/products, /api/customers).
 * Use in API routes for cache-aside list responses. On create/update/delete, list cache is invalidated.
 */

export {
  getBrandList,
  createBrand,
  updateBrand,
  deleteBrand,
} from "./cachedBrand";

export {
  getProductList,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./cachedProduct";
export type { ListProductsOptions } from "./cachedProduct";

export {
  getCustomerList,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "./cachedCustomer";
