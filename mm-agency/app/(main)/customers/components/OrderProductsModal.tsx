"use client";

import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { HiOutlineX, HiOutlinePrinter } from "react-icons/hi";
import type { Customer, ProductForOrder } from "./types";
import type { InvoiceLine } from "./invoicePrint";
import { InvoiceBill, type InvoiceCustomer, type InvoiceLineItem } from "./InvoiceBill";

export function OrderProductsModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [allProducts, setAllProducts] = useState<ProductForOrder[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  /** After save, show invoice (InvoiceBill UI); user can Print or Done. */
  const [savedInvoiceLines, setSavedInvoiceLines] = useState<InvoiceLine[] | null>(null);
  const [shouldPrintAfterSave, setShouldPrintAfterSave] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: `Invoice-${customer.name}-${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page { margin: 14mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    `,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [brandsRes, productsRes] = await Promise.all([
          fetch("/api/brands", { credentials: "include" }),
          fetch("/api/products"),
        ]);
        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          setBrands(brandsData);
          setSelectedBrandIds(brandsData.length ? new Set([brandsData[0].id]) : new Set());
        }
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setAllProducts(productsData);
          setQuantities({});
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (shouldPrintAfterSave && savedInvoiceLines?.length && printContentRef.current) {
      setShouldPrintAfterSave(false);
      const t = setTimeout(() => handlePrint(), 300);
      return () => clearTimeout(t);
    }
  }, [shouldPrintAfterSave, savedInvoiceLines, handlePrint]);

  const toggleBrand = (brandId: string) => {
    setSelectedBrandIds((prev) => {
      const next = new Set(prev);
      if (next.has(brandId)) next.delete(brandId);
      else next.add(brandId);
      return next;
    });
  };

  const products =
    selectedBrandIds.size ? allProducts.filter((p) => selectedBrandIds.has(p.brand_id)) : [];

  const setQty = (productId: string, value: number) => {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;
    const capped = Math.max(0, Math.min(product.stock_count, Math.floor(value)));
    setQuantities((prev) =>
      capped === 0
        ? (() => {
            const n = { ...prev };
            delete n[productId];
            return n;
          })()
        : { ...prev, [productId]: capped }
    );
  };

  const lineTotal = (p: ProductForOrder) => (quantities[p.id] ?? 0) * parseFloat(p.price);
  const total = products.reduce((sum, p) => sum + lineTotal(p), 0);
  const hasItems =
    Object.keys(quantities).length > 0 && Object.values(quantities).some((q) => q > 0);

  function buildInvoiceLines(): InvoiceLine[] {
    return products
      .filter((p) => (quantities[p.id] ?? 0) > 0)
      .map((p) => {
        const qty = quantities[p.id]!;
        const up = parseFloat(p.price);
        return {
          name: p.name,
          brand_name: p.brand_name,
          qty,
          unitPrice: up,
          total: Math.round(up * qty * 100) / 100,
        };
      });
  }

  async function handleSave(andPrint: boolean) {
    setError("");
    if (!hasItems) {
      setError("Add at least one product with quantity.");
      return;
    }
    setSaving(true);
    try {
      const items = Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([product_id, quantity]) => ({ product_id, quantity }));
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customer.id, items }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          Array.isArray(data.insufficient) && data.insufficient.length > 0
            ? data.insufficient
                .map(
                  (x: { product_id: string; requested: number; available: number }) => {
                    const name = allProducts.find((p) => p.id === x.product_id)?.name ?? x.product_id;
                    return `${name}: requested ${x.requested}, ${x.available} available`;
                  }
                )
                .join("; ")
            : data.error ?? "Failed to create order";
        throw new Error(msg);
      }
      setSavedInvoiceLines(buildInvoiceLines());
      onSaved();
      if (andPrint) setShouldPrintAfterSave(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const productsByBrand = products.reduce<Record<string, ProductForOrder[]>>((acc, p) => {
    if (!acc[p.brand_name]) acc[p.brand_name] = [];
    acc[p.brand_name].push(p);
    return acc;
  }, {});

  const invoiceCustomer: InvoiceCustomer = {
    name: customer.name,
    phone: customer.phone ?? undefined,
    address: customer.address ?? undefined,
  };
  const invoiceItems: Omit<InvoiceLineItem, "id">[] = savedInvoiceLines
    ? savedInvoiceLines.map((line) => ({
        productName: `${line.name} (${line.brand_name})`,
        quantity: line.qty,
        price: line.unitPrice,
      }))
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 shrink-0">
          <h2 className="text-lg font-semibold text-white">
            {savedInvoiceLines ? "Invoice" : `Add products for ${customer.name}`}
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
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {savedInvoiceLines ? (
            <InvoiceBill
              readOnly
              initialCustomer={invoiceCustomer}
              initialItems={invoiceItems}
              contentRef={printContentRef}
              className="rounded-xl border border-zinc-700 bg-zinc-800/30 overflow-hidden"
            />
          ) : (
            <>
              {error && (
                <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
              )}
              {loading ? (
            <p className="text-zinc-500">Loading…</p>
          ) : (
            <>
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-zinc-400">Select brands</p>
                <div className="flex flex-wrap gap-2">
                  {brands.map((b) => (
                    <label
                      key={b.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 cursor-pointer hover:bg-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrandIds.has(b.id)}
                        onChange={() => toggleBrand(b.id)}
                        className="rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-white">{b.name}</span>
                    </label>
                  ))}
                </div>
                {brands.length === 0 && (
                  <p className="text-xs text-zinc-500">No brands. Add brands first.</p>
                )}
              </div>

              <p className="mb-2 text-sm font-medium text-zinc-400">Products (by selected brands)</p>
              {products.length === 0 ? (
                <p className="text-zinc-500">
                  {selectedBrandIds.size === 0
                    ? "Select at least one brand above."
                    : "No products for selected brands."}
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(productsByBrand).map(([brandName, prods]) => (
                    <div key={brandName}>
                      <p className="mb-2 text-sm font-semibold text-emerald-400/90">{brandName}</p>
                      <div className="space-y-2">
                        {prods.map((p) => {
                          const qty = quantities[p.id] ?? 0;
                          const available = p.stock_count - qty;
                          return (
                            <div
                              key={p.id}
                              className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3"
                            >
                              <div className="flex-1 min-w-[140px]">
                                <p className="font-medium text-white">{p.name}</p>
                                <p className="text-xs text-zinc-500">
                                  {parseFloat(p.price).toFixed(2)} each
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-zinc-400">Qty</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={p.stock_count}
                                  value={qty || ""}
                                  onChange={(e) =>
                                    setQty(
                                      p.id,
                                      e.target.value === "" ? 0 : parseInt(e.target.value, 10)
                                    )
                                  }
                                  className="w-20 rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-white text-center"
                                />
                                <span className="text-xs text-zinc-500 w-24">
                                  {available} available
                                </span>
                              </div>
                              {qty > 0 && (
                                <span className="text-sm text-emerald-400">
                                  {(qty * parseFloat(p.price)).toFixed(2)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
            </>
          )}
        </div>
        {!savedInvoiceLines ? (
          <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between gap-4 shrink-0">
            <p className="text-lg font-semibold text-white">
              Total: <span className="text-emerald-400">{total.toFixed(2)}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving || !hasItems}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving || !hasItems}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? "Saving…" : (
                  <>
                    <HiOutlinePrinter className="h-5 w-5" />
                    Save and Print
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              title="Print invoice"
            >
              <HiOutlinePrinter className="h-5 w-5" />
              Print invoice
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
