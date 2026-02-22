"use client";

import { useEffect, useState } from "react";
import { HiOutlinePlus } from "react-icons/hi";
import {
  CustomerModal,
  CustomersTable,
  DeleteConfirmModal,
  OrderProductsModal,
  type Customer,
} from "./components";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCustomer, setModalCustomer] = useState<Customer | null | "new">(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerForOrder, setCustomerForOrder] = useState<Customer | null>(null);

  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Customers</h1>
          <p className="mt-1 text-zinc-500">Manage customers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setModalCustomer("new")}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <HiOutlinePlus className="h-5 w-5" />
            Add customer
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading…</div>
        ) : (
          <CustomersTable
            customers={customers}
            onEdit={(c) => setModalCustomer(c)}
            onDelete={setCustomerToDelete}
            onAddOrder={setCustomerForOrder}
          />
        )}
      </div>

      {modalCustomer !== null && (
        <CustomerModal
          customer={modalCustomer === "new" ? null : modalCustomer}
          onClose={() => setModalCustomer(null)}
          onSaved={loadCustomers}
        />
      )}
      {customerToDelete && (
        <DeleteConfirmModal
          customer={customerToDelete}
          onClose={() => setCustomerToDelete(null)}
          onDeleted={loadCustomers}
        />
      )}
      {customerForOrder && (
        <OrderProductsModal
          customer={customerForOrder}
          onClose={() => setCustomerForOrder(null)}
          onSaved={() => setCustomerForOrder(null)}
        />
      )}
    </div>
  );
}
