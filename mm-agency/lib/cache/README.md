# Redis cache layer

- **Setup**: Set `REDIS_URL` (e.g. `redis://localhost:6379`). Install: `npm install ioredis`.
- **Keys** (list/table only, same structure as API): `mm:brand`, `mm:product`, `mm:product:{brandName}`, `mm:customer`. No per-entity keys.
- **Flow**: Cache-aside for lists: read list from cache; on miss, fetch from DB and set cache. On CREATE/UPDATE/DELETE, invalidate the relevant list cache.
- **Services**: Use `getBrandList`, `getProductList`, `getCustomerList` in GET handlers; use `createBrand`/`updateBrand`/`deleteBrand` (and product/customer) in write handlers so cache is invalidated.
