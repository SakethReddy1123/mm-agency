"use client";

import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { HiOutlinePrinter, HiOutlineX } from "react-icons/hi";
import { OrderPrintContent, type OrderPrintData } from "./OrderPrintContent";

type OrderListItem = {
  order_id: string;
  order_number: string | null;
  customer_id: string;
  customer_name: string;
  created_at: string;
  total: number;
};

type OrderInvoiceResponse = {
  order_id: string;
  order_number: string | null;
  customer: { name: string; phone?: string; address?: string };
  created_at: string;
  items: {
    productName: string;
    productImageUrl: string | null;
    quantity: number;
    price: number;
    total: number;
  }[];
  total: number;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<OrderPrintData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printOrder
      ? `Order-${printOrder.order_number ?? "invoice"}-${printOrder.customer.name}`
      : "Order",
    pageStyle: `
      @page { margin: 14mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    `,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error("Failed to load orders");
        const data = await res.json();
        setOrders(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function openPrint(order: OrderListItem) {
    try {
      const res = await fetch(`/api/orders/${order.order_id}`);
      if (!res.ok) throw new Error("Failed to load order");
      const data: OrderInvoiceResponse = await res.json();
      setPrintOrder({
        order_number: data.order_number,
        customer: data.customer,
        order_date: data.created_at,
        items: data.items.map((i) => ({
          productName: i.productName,
          productImageUrl: i.productImageUrl,
          quantity: i.quantity,
          price: i.price,
          total: i.total,
        })),
        total: data.total,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load order");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">Orders</h1>
      <p className="mt-1 text-zinc-500">
        Each row is one order. Use the print icon to print the order with all products and images.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
          Loading…
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
          No orders yet.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/50">
                <th className="px-4 py-3 font-medium text-zinc-300">Customer</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Order number</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Order date</th>
                <th className="px-4 py-3 font-medium text-zinc-300 text-right">Total amount</th>
                <th className="w-12 px-2 py-3" aria-label="Print" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orders.map((order) => (
                <tr
                  key={order.order_id}
                  className="text-zinc-400 transition-colors hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 font-medium text-white">{order.customer_name}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-300">
                    {order.order_number ?? order.order_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-white">
                    ₹{order.total.toFixed(2)}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => openPrint(order)}
                      className="rounded p-1.5 text-zinc-400 hover:bg-zinc-600 hover:text-white"
                      title="Print order"
                      aria-label="Print order"
                    >
                      <HiOutlinePrinter className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {printOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setPrintOrder(null)}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-lg font-semibold text-white">
                Order {printOrder.order_number ?? "Invoice"} — {printOrder.customer.name}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrint()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  <HiOutlinePrinter className="h-5 w-5" />
                  Print / Download
                </button>
                <button
                  type="button"
                  onClick={() => setPrintOrder(null)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  aria-label="Close"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div ref={printRef}>
                <OrderPrintContent data={printOrder} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
