"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiOutlineTag,
  HiOutlineUsers,
  HiOutlineShoppingCart,
  HiOutlineChartBar,
  HiOutlineMenu,
  HiOutlineX,
} from "react-icons/hi";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: HiOutlineChartBar },
  { href: "/brand", label: "Brand", icon: HiOutlineTag },
  { href: "/product", label: "Product", icon: HiOutlineTag },
  { href: "/customers", label: "Customers", icon: HiOutlineUsers },
  { href: "/orders", label: "Orders", icon: HiOutlineShoppingCart },
] as const;

function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-emerald-600/20 text-emerald-400"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function SideMenu() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header + hamburger */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3 lg:hidden">
        <span className="text-lg font-semibold text-white">MM Agency</span>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <HiOutlineX className="h-6 w-6" />
          ) : (
            <HiOutlineMenu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar: drawer on mobile, fixed on desktop */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 lg:flex lg:translate-x-0 ${
          mobileOpen ? "flex translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4 lg:justify-center">
          <span className="text-lg font-semibold text-white">MM Agency</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <NavLinks onLinkClick={() => setMobileOpen(false)} />
        </nav>
        <div className="border-t border-zinc-800 p-3">
          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Desktop: spacer so content is not under sidebar */}
      <div className="hidden w-64 shrink-0 lg:block" />
    </>
  );
}
