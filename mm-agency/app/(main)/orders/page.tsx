export default function OrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">Orders</h1>
      <p className="mt-1 text-zinc-500">View and manage orders.</p>
      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-4 py-3 font-medium text-zinc-300">Order</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Customer</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Date</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {[
                {
                  id: "ORD-001",
                  customer: "Acme Corp",
                  status: "Completed",
                  date: "2025-02-20",
                  total: "$1,240",
                },
                {
                  id: "ORD-002",
                  customer: "Beta Inc",
                  status: "Pending",
                  date: "2025-02-21",
                  total: "$890",
                },
                {
                  id: "ORD-003",
                  customer: "Gamma LLC",
                  status: "Processing",
                  date: "2025-02-22",
                  total: "$2,100",
                },
              ].map((row) => (
                <tr
                  key={row.id}
                  className="text-zinc-400 transition-colors hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 font-medium text-white">{row.id}</td>
                  <td className="px-4 py-3">{row.customer}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : row.status === "Pending"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-zinc-600/30 text-zinc-300"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
