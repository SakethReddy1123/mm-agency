"use client";

import { useCallback, useEffect, useState } from "react";
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus } from "react-icons/hi";

type Brand = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

type ModalMode = { type: "create" } | { type: "edit"; brand: Brand } | null;

export function BrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brands", { credentials: "include" });
      if (!res.ok) throw new Error(res.status === 401 ? "Unauthorized" : "Failed to load");
      const data = await res.json();
      setBrands(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load brands");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete brand "${name}"?`)) return;
    try {
      const res = await fetch(`/api/brands/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchBrands();
    } catch {
      setError("Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-zinc-500">Create and edit brands. Logo is optional.</p>
        <button
          type="button"
          onClick={() => setModal({ type: "create" })}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          <HiOutlinePlus className="h-5 w-5" />
          Add brand
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-12 text-center text-zinc-500">
          Loading…
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="px-4 py-3 font-medium text-zinc-300">Logo</th>
                  <th className="px-4 py-3 font-medium text-zinc-300">Name</th>
                  <th className="px-4 py-3 font-medium text-zinc-300">Slug</th>
                  <th className="px-4 py-3 font-medium text-zinc-300">Description</th>
                  <th className="w-24 px-4 py-3 font-medium text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {brands.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      No brands yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  brands.map((b) => (
                    <tr
                      key={b.id}
                      className="text-zinc-400 transition-colors hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3">
                        {b.logo_url ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-zinc-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={b.logo_url}
                              alt=""
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{b.name}</td>
                      <td className="px-4 py-3 font-mono text-zinc-500">{b.slug ?? "—"}</td>
                      <td className="max-w-[200px] truncate px-4 py-3" title={b.description ?? ""}>
                        {b.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setModal({ type: "edit", brand: b })}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-emerald-400"
                            aria-label="Edit"
                          >
                            <HiOutlinePencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id, b.name)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400"
                            aria-label="Delete"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                            <span className="text-xs">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <BrandFormModal
          mode={modal}
          onClose={() => {
            setModal(null);
            setFormError(null);
          }}
          onSuccess={() => {
            setModal(null);
            setFormError(null);
            fetchBrands();
          }}
          submitting={submitting}
          setSubmitting={setSubmitting}
          formError={formError}
          setFormError={setFormError}
        />
      )}
    </div>
  );
}

type BrandFormModalProps = {
  mode: ModalMode;
  onClose: () => void;
  onSuccess: () => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  formError: string | null;
  setFormError: (v: string | null) => void;
};

function BrandFormModal({
  mode,
  onClose,
  onSuccess,
  submitting,
  setSubmitting,
  formError,
  setFormError,
}: BrandFormModalProps) {
  const isEdit = mode?.type === "edit";
  const brand = isEdit ? mode.brand : null;

  async function handleDeleteClick() {
    if (!brand) return;
    if (!confirm(`Delete brand "${brand.name}"? This cannot be undone.`)) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/brands/${brand.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      onClose();
      onSuccess();
    } catch {
      setFormError("Failed to delete brand");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = (fd.get("name") as string)?.trim();
    if (!name) {
      setFormError("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit ? `/api/brands/${brand!.id}` : "/api/brands";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error || "Request failed");
        return;
      }
      onSuccess();
    } catch {
      setFormError("Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-form-title"
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 id="brand-form-title" className="text-lg font-semibold text-white">
            {isEdit ? "Edit brand" : "Add brand"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Close"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {formError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="brand-name" className="mb-1.5 block text-sm font-medium text-zinc-400">
              Name *
            </label>
            <input
              id="brand-name"
              name="name"
              type="text"
              required
              defaultValue={brand?.name ?? ""}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Brand name"
            />
          </div>

          <div>
            <label htmlFor="brand-slug" className="mb-1.5 block text-sm font-medium text-zinc-400">
              Slug (optional, auto from name)
            </label>
            <input
              id="brand-slug"
              name="slug"
              type="text"
              defaultValue={brand?.slug ?? ""}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="url-slug"
            />
          </div>

          <div>
            <label htmlFor="brand-desc" className="mb-1.5 block text-sm font-medium text-zinc-400">
              Description (optional)
            </label>
            <textarea
              id="brand-desc"
              name="description"
              rows={3}
              defaultValue={brand?.description ?? ""}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Short description"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Logo (optional)
            </label>
            <input
              name="logo"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm file:text-white file:hover:bg-emerald-500"
            />
            {brand?.logo_url && (
              <p className="mt-1.5 text-xs text-zinc-500">
                Current: <span className="truncate font-mono">{brand.logo_url}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3 sm:flex-1">
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={submitting}
                  className="rounded-xl border border-red-500/50 py-3 px-4 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60"
                >
                  Delete brand
                </button>
              )}
            </div>
            <div className="flex gap-3 sm:flex-1 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 sm:flex-none sm:px-6"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60 sm:flex-none sm:px-6"
              >
                {submitting ? "Saving…" : isEdit ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
