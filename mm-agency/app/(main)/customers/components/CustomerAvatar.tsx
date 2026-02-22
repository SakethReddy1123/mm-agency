"use client";

import Image from "next/image";
import type { Customer } from "./types";

export function CustomerAvatar({ customer }: { customer: Customer }) {
  if (customer.image_url) {
    return (
      <Image
        src={customer.image_url}
        alt=""
        width={40}
        height={40}
        unoptimized
        className="h-10 w-10 rounded-full object-cover bg-zinc-800"
      />
    );
  }
  const initial = (customer.name?.trim().slice(0, 1) || "?").toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600/30 text-emerald-400 text-sm font-medium">
      {initial}
    </div>
  );
}
