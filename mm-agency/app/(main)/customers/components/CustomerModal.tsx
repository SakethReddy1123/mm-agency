"use client";

import { useEffect, useState } from "react";
import { HiOutlineX } from "react-icons/hi";
import type { Customer } from "./types";

const ACCEPT_IMAGES = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml";

export function CustomerModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!customer;
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone ?? "");
      setAddress(customer.address ?? "");
      setImageFile(null);
      setImagePreview(null);
      setRemoveImage(false);
    } else {
      setName("");
      setPhone("");
      setAddress("");
      setImageFile(null);
      setImagePreview(null);
      setRemoveImage(false);
    }
  }, [customer]);

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
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("phone", phone.trim());
      formData.set("address", address.trim());
      if (imageFile) formData.set("image", imageFile);
      if (isEdit && removeImage) formData.set("remove_image", "true");

      if (isEdit && customer) {
        const res = await fetch(`/api/customers/${customer.id}`, {
          method: "PATCH",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to update");
        }
      } else {
        const res = await fetch("/api/customers", {
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
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit customer" : "Add customer"}
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
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Image</label>
            {(imagePreview || (isEdit && customer?.image_url && !removeImage)) ? (
              <div className="flex items-center gap-3">
                <img
                  src={imagePreview ?? customer!.image_url!}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover bg-zinc-800"
                />
                <div className="flex flex-col gap-1">
                  <label className="cursor-pointer rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">
                    Replace
                    <input
                      key={isEdit ? customer?.id : "new"}
                      type="file"
                      accept={ACCEPT_IMAGES}
                      className="sr-only"
                      onChange={onImageChange}
                    />
                  </label>
                  {isEdit && customer?.image_url && (
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
                  key={isEdit ? customer?.id : "new"}
                  type="file"
                  accept={ACCEPT_IMAGES}
                  className="sr-only"
                  onChange={onImageChange}
                />
              </label>
            )}
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
              placeholder="Customer name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              placeholder="Address"
            />
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
