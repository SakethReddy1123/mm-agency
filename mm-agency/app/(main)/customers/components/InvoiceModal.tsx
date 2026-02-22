"use client";

import { HiOutlineX } from "react-icons/hi";
import { InvoiceBill, type InvoiceCustomer, type InvoiceLineItem } from "./InvoiceBill";
import type { Customer } from "./types";

export type InvoiceModalProps = {
  onClose: () => void;
  /** Pre-fill customer from list (e.g. selected customer) */
  customer?: Customer | null;
  /** Pre-fill line items (e.g. from order) */
  initialItems?: Omit<InvoiceLineItem, "id">[];
};

function toInvoiceCustomer(c: Customer): InvoiceCustomer {
  return {
    name: c.name,
    phone: c.phone ?? undefined,
    address: c.address ?? undefined,
  };
}

export function InvoiceModal({ onClose, customer, initialItems }: InvoiceModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 shrink-0">
          <h2 className="text-lg font-semibold text-white">Invoice / Bill</h2>
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
          <InvoiceBill
            initialCustomer={customer ? toInvoiceCustomer(customer) : undefined}
            initialItems={initialItems}
          />
        </div>
      </div>
    </div>
  );
}
