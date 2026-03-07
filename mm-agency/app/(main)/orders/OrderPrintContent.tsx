"use client";

export type OrderPrintItem = {
  productName: string;
  productImageUrl: string | null;
  quantity: number;
  price: number;
  total: number;
};

export type OrderPrintData = {
  order_number: string | null;
  customer: { name: string; phone?: string; address?: string };
  order_date: string;
  items: OrderPrintItem[];
  total: number;
};

type OrderPrintContentProps = {
  data: OrderPrintData;
  companyName?: string;
  companyTagline?: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Printable order invoice: customer, order number, date, and products with image, name, qty, amount. */
export function OrderPrintContent({
  data,
  companyName = "MM Agency",
  companyTagline = "Quality products & services",
}: OrderPrintContentProps) {
  return (
    <div className="bg-white text-zinc-900 p-6 max-w-2xl mx-auto print:p-6">
      <header className="border-b-2 border-zinc-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{companyName}</h1>
        {companyTagline && (
          <p className="text-sm text-zinc-600 mt-0.5">{companyTagline}</p>
        )}
      </header>

      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          Bill To
        </h2>
        <div className="text-zinc-800">
          <p className="font-medium">{data.customer.name || "—"}</p>
          {data.customer.phone && <p className="text-sm">{data.customer.phone}</p>}
          {data.customer.address && (
            <p className="text-sm text-zinc-600 whitespace-pre-wrap">{data.customer.address}</p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-6 mb-6 text-sm">
        <div>
          <span className="text-zinc-500">Order number</span>
          <p className="font-medium text-zinc-900">
            {data.order_number ?? "—"}
          </p>
        </div>
        <div>
          <span className="text-zinc-500">Order date</span>
          <p className="font-medium text-zinc-900">{formatDate(data.order_date)}</p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-zinc-300">
            <th className="text-left py-2 px-2 w-16 font-semibold text-zinc-700">Image</th>
            <th className="text-left py-2 px-2 font-semibold text-zinc-700">Product</th>
            <th className="text-right py-2 px-2 w-20 font-semibold text-zinc-700">Qty</th>
            <th className="text-right py-2 px-2 w-24 font-semibold text-zinc-700">Price</th>
            <th className="text-right py-2 px-2 w-28 font-semibold text-zinc-700">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={idx} className="border-b border-zinc-200">
              <td className="py-2 px-2 align-middle">
                {item.productImageUrl ? (
                  <img
                    src={item.productImageUrl}
                    alt=""
                    className="w-12 h-12 object-cover rounded border border-zinc-200"
                  />
                ) : (
                  <span className="text-zinc-400 text-xs">—</span>
                )}
              </td>
              <td className="py-2 px-2 font-medium">{item.productName || "—"}</td>
              <td className="py-2 px-2 text-right tabular-nums">{item.quantity}</td>
              <td className="py-2 px-2 text-right tabular-nums">₹{item.price.toFixed(2)}</td>
              <td className="py-2 px-2 text-right tabular-nums font-medium">
                ₹{item.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Total amount</p>
          <p className="text-2xl font-bold text-zinc-900 tabular-nums">
            ₹{data.total.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
