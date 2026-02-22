"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
} from "react-icons/hi";

type Brand = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

type Product = {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  price: string;
  stock_count: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  brand_name: string;
};

const ACCEPT_IMAGES = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml";

function ProductImage({ product }: { product: Product }) {
  if (product.image_url) {
    return (
      <Image
        src={product.image_url}
        alt=""
        width={40}
        height={40}
        unoptimized
        className="h-10 w-10 rounded object-cover bg-zinc-800"
      />
    );
  }
  const initial = (product.name?.trim().slice(0, 1) || "?").toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-emerald-600/30 text-emerald-400 text-sm font-medium">
      {initial}
    </div>
  );
}

function ProductModal({
  product,
  brands,
  onClose,
  onSaved,
}: {
  product: Product | null;
  brands: Brand[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [brand_id, setBrandId] = useState(product?.brand_id ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [stock_count, setStockCount] = useState(
    product?.stock_count !== undefined ? String(product.stock_count) : "0"
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (product) {
      setBrandId(product.brand_id);
      setName(product.name);
      setDescription(product.description ?? "");
      setPrice(product.price);
      setStockCount(String(product.stock_count));
      setImageFile(null);
      setImagePreview(null);
      setRemoveImage(false);
    } else {
      setBrandId(brands[0]?.id ?? "");
      setName("");
      setDescription("");
      setPrice("");
      setStockCount("0");
      setImageFile(null);
      setImagePreview(null);
      setRemoveImage(false);
    }
  }, [product, brands]);

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file ?? null);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    } else {
      setImagePreview(null);
    }
  }

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!brand_id && !isEdit) {
      setError("Please select a brand.");
      return;
    }
    const priceNum = parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Enter a valid price.");
      return;
    }
    const stock = parseInt(stock_count, 10);
    const stockVal = Number.isNaN(stock) || stock < 0 ? 0 : stock;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("price", String(priceNum));
      formData.set("description", description.trim());
      formData.set("stock_count", String(stockVal));
      if (brand_id) formData.set("brand_id", brand_id);
      if (imageFile) formData.set("image", imageFile);
      if (isEdit && removeImage) formData.set("remove_image", "true");

      if (isEdit && product) {
        const res = await fetch(`/api/products/${product.id}`, {
          method: "PATCH",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to update");
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to create");
        }
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 sticky top-0 bg-zinc-900 z-10">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit product" : "Add product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Close"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">
              Brand <span className="text-red-400">*</span>
            </label>
            <select
              value={brand_id}
              onChange={(e) => setBrandId(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Product name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              placeholder="Description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Price <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Stock
              </label>
              <input
                type="number"
                min="0"
                value={stock_count}
                onChange={(e) => setStockCount(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">
              Image
            </label>
            {(imagePreview ||
              (isEdit && product?.image_url && !removeImage)) ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagePreview can be data URL */}
                <img
                  src={imagePreview ?? product!.image_url!}
                  alt=""
                  className="h-16 w-16 rounded object-cover bg-zinc-800"
                />
                <div className="flex flex-col gap-1">
                  <label className="cursor-pointer rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">
                    Replace
                    <input
                      key={isEdit ? product?.id : "new"}
                      type="file"
                      accept={ACCEPT_IMAGES}
                      className="sr-only"
                      onChange={onImageChange}
                    />
                  </label>
                  {isEdit && product?.image_url && (
                    <label className="flex items-center gap-2 text-sm text-zinc-400">
                      <input
                        type="checkbox"
                        checked={removeImage}
                        onChange={(e) => setRemoveImage(e.target.checked)}
                        className="rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                      />
                      Remove image
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-600 bg-zinc-800/30 py-4 text-sm text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800/50">
                <span>Choose image (JPEG, PNG, GIF, WebP, SVG)</span>
                <input
                  key={isEdit ? product?.id : "new"}
                  type="file"
                  accept={ACCEPT_IMAGES}
                  className="sr-only"
                  onChange={onImageChange}
                />
              </label>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  product,
  onClose,
  onDeleted,
}: {
  product: Product;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete");
      }
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
        <p className="text-zinc-300">
          Delete product <strong className="text-white">{product.name}</strong>?
          This cannot be undone.
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandNameFilter, setBrandNameFilter] = useState("");
  const [modalProduct, setModalProduct] = useState<Product | null | "new">(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const loadProducts = useCallback(async (filter?: string) => {
    const f = filter !== undefined ? filter : brandNameFilter;
    setLoading(true);
    try {
      const url = f.trim()
        ? `/api/products?brandName=${encodeURIComponent(f.trim())}`
        : "/api/products";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } finally {
      setLoading(false);
    }
  }, [brandNameFilter]);

  useEffect(() => {
    const t = setTimeout(() => loadProducts(), 400);
    return () => clearTimeout(t);
  }, [brandNameFilter, loadProducts]);

  useEffect(() => {
    async function loadBrands() {
      try {
        const res = await fetch("/api/brands", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setBrands(data);
        }
      } catch {
        // ignore
      }
    }
    loadBrands();
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Products
          </h1>
          <p className="mt-1 text-zinc-500">Manage products. Filter by brand name.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalProduct("new")}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          <HiOutlinePlus className="h-5 w-5" />
          Add product
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <label className="text-sm font-medium text-zinc-400">
          Filter by brand name
        </label>
        <input
          type="text"
          value={brandNameFilter}
          onChange={(e) => setBrandNameFilter(e.target.value)}
          placeholder="Type brand name..."
          className="max-w-xs rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <p className="text-xs text-zinc-500">
          Products list updates as you type (filter by brand name).
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading…</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No products found. Add one or change the brand filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/30">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Brand
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Description
                  </th>
                  <th className="w-24 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/20">
                    <td className="px-4 py-3">
                      <ProductImage product={p} />
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {p.brand_name}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {typeof p.price === "string" ? p.price : Number(p.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {p.stock_count}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-zinc-400">
                      {p.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setModalProduct(p)}
                          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-700 hover:text-emerald-400"
                          title="Edit"
                        >
                          <HiOutlinePencil className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductToDelete(p)}
                          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-700 hover:text-red-400"
                          title="Delete"
                        >
                          <HiOutlineTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalProduct !== null && (
        <ProductModal
          product={modalProduct === "new" ? null : modalProduct}
          brands={brands}
          onClose={() => setModalProduct(null)}
          onSaved={loadProducts}
        />
      )}
      {productToDelete && (
        <DeleteConfirmModal
          product={productToDelete}
          onClose={() => setProductToDelete(null)}
          onDeleted={loadProducts}
        />
      )}
    </div>
  );
}
