"use client";

import { HiOutlinePencil, HiOutlineTrash, HiOutlineShoppingCart } from "react-icons/hi";
import { CustomerAvatar } from "./CustomerAvatar";
import type { Customer } from "./types";

export function CustomersTable({
  customers,
  onEdit,
  onDelete,
  onAddOrder,
}: {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onAddOrder: (customer: Customer) => void;
}) {
  if (customers.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        No customers yet. Add one to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-800/30">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Image
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Phone
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Address
            </th>
            <th className="w-24 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-zinc-800/20">
              <td className="px-4 py-3">
                <CustomerAvatar customer={c} />
              </td>
              <td className="px-4 py-3 font-medium text-white">{c.name}</td>
              <td className="px-4 py-3 text-zinc-400">{c.phone || "—"}</td>
              <td className="max-w-[200px] truncate px-4 py-3 text-zinc-400">
                {c.address || "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onAddOrder(c)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-700 hover:text-amber-400"
                    title="Add products"
                  >
                    <HiOutlineShoppingCart className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-700 hover:text-emerald-400"
                    title="Edit"
                  >
                    <HiOutlinePencil className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(c)}
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
  );
}
