"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "▦" },
  { label: "Events", href: "/admin/events", icon: "◈" },
  { label: "Stand Registrations", href: "/admin/stands", icon: "▤" },
  { label: "Responses", href: "/admin/responses", icon: "▧" },
  { label: "Analytics", href: "/admin/analytics", icon: "◷" },
  { label: "Users", href: "/admin/users", icon: "♙" },
];

interface AdminSidebarProps {
  onLogout: () => void;
  userName?: string;
}

export default function AdminSidebar({ onLogout, userName }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-hidden bg-[#142b50] text-white">
      {/* LOGO */}
      <div className="shrink-0 p-6">
        <h1 className="text-xl font-bold">
          <span className="text-blue-400">Form</span>
        </h1>
        <p className="mt-1 text-xs text-blue-200">Administration Panel</p>
      </div>

      {/* MENU */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-300">
          Main Menu
        </p>

        <nav className="space-y-2">
          {MENU_ITEMS.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  active
                    ? "bg-blue-500/20 font-semibold text-white"
                    : "text-blue-100/70 hover:bg-blue-500/20 hover:text-white"
                }`}
              >
                <span className="w-4 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ACCOUNT & SIGN OUT */}
      <div className="shrink-0 border-t border-white/10 bg-[#142b50] p-6">
        <p className="truncate text-sm font-semibold">
          {userName || "Super Admin"}
        </p>
        <p className="mt-1 text-xs text-blue-200">
          {userName ? "Super Admin" : "Administrator"}
        </p>

        <button
          onClick={onLogout}
          className="mt-5 w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
        >
          ↪ Sign Out
        </button>
      </div>
    </aside>
  );
}
