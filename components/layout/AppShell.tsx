"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  BarChart3,
  LogOut,
} from "lucide-react";
import { ArkanaLogo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABEL } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["owner"] },
  { href: "/pos", label: "Kasir", icon: ShoppingCart, roles: ["owner", "cashier"] },
  { href: "/orders", label: "Antrian", icon: ClipboardList, roles: ["owner", "barista", "cashier"] },
  { href: "/inventory", label: "Inventori", icon: Package, roles: ["owner", "cashier"] },
  { href: "/reports", label: "Laporan", icon: BarChart3, roles: ["owner"] },
] as const;

export function AppShell({
  role,
  fullName,
  children,
}: {
  role: Role;
  fullName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV.filter((n) => (n.roles as readonly string[]).includes(role));

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* Sidebar — tablet landscape & laptop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/60 px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <ArkanaLogo size={34} />
          <div>
            <p className="text-sm font-semibold leading-tight">Arkana</p>
            <p className="text-[11px] leading-tight text-text-faint">Point of Sale</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-violet/15 text-white before:content-[''] relative"
                    : "text-text-muted hover:bg-white/5 hover:text-white"
                )}
              >
                {active && (
                  <span className="absolute left-0 h-5 w-1 rounded-r-full bg-gradient-to-b from-violet-light to-magenta" />
                )}
                <Icon size={18} className={active ? "text-violet-light" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-light to-magenta text-xs font-semibold">
              {fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{fullName}</p>
              <p className="text-[11px] text-text-faint">{ROLE_LABEL[role]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-border bg-surface/40 px-4 py-3.5 backdrop-blur-sm md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <ArkanaLogo size={28} />
            <span className="font-semibold">Arkana</span>
          </div>
          <p className="hidden text-sm text-text-muted md:block">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-xs font-medium text-violet-light md:inline-flex">
              {ROLE_LABEL[role]}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      </div>

      {/* Bottom nav — phone */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-surface/95 py-2 backdrop-blur-lg md:hidden">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium",
                active ? "text-violet-light" : "text-text-faint"
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
