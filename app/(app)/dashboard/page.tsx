import { Wallet, ShoppingBag, Receipt } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard, RevenueChart, TopProducts, LowStockAlert } from "@/components/dashboard/Dashboard";
import { formatRupiah } from "@/lib/utils";

export const dynamic = "force-dynamic";

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function pctChange(today: number, yesterday: number) {
  if (yesterday === 0) return today === 0 ? 0 : 100;
  return ((today - yesterday) / yesterday) * 100;
}

export default async function DashboardPage() {
  const { profile } = await requireRole(["owner"]);
  const supabase = await createClient();

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);

  const [{ data: orders }, { data: items }, { data: inventory }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total, created_at, status")
      .neq("status", "cancelled")
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("order_items")
      .select("product_name, quantity, order_id, orders!inner(created_at, status)")
      .gte("orders.created_at", sevenDaysAgo.toISOString())
      .neq("orders.status", "cancelled"),
    supabase
      .from("inventory")
      .select("stock_qty, unit, low_stock_threshold, products(name, is_active)")
      .order("stock_qty", { ascending: true }),
  ]);

  const safeOrders = orders ?? [];

  const todayOrders = safeOrders.filter((o) => new Date(o.created_at) >= todayStart);
  const yesterdayOrders = safeOrders.filter(
    (o) => new Date(o.created_at) >= yesterdayStart && new Date(o.created_at) < todayStart
  );

  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + Number(o.total), 0);
  const avgOrderValue = todayOrders.length ? todayRevenue / todayOrders.length : 0;

  const series: { label: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const total = safeOrders.filter((o) => dayKey(o.created_at) === key).reduce((s, o) => s + Number(o.total), 0);
    series.push({ label: d.toLocaleDateString("id-ID", { weekday: "short" }), total });
  }

  const productMap = new Map<string, number>();
  (items ?? []).forEach((it) => {
    productMap.set(it.product_name, (productMap.get(it.product_name) ?? 0) + it.quantity);
  });
  const topProducts = Array.from(productMap.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const lowStock = (inventory ?? [])
    .filter((inv: any) => inv.products?.is_active && Number(inv.stock_qty) <= Number(inv.low_stock_threshold))
    .map((inv: any) => ({
      name: inv.products?.name ?? "-",
      stock: Number(inv.stock_qty),
      unit: inv.unit,
      threshold: Number(inv.low_stock_threshold),
    }))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-xl font-semibold md:text-2xl">Halo, {profile.full_name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-text-muted">Ini ringkasan performa Arkana hari ini.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Pendapatan Hari Ini"
          value={formatRupiah(todayRevenue)}
          delta={pctChange(todayRevenue, yesterdayRevenue)}
          icon={<Wallet size={18} />}
          glow
        />
        <StatCard
          label="Total Order Hari Ini"
          value={String(todayOrders.length)}
          delta={pctChange(todayOrders.length, yesterdayOrders.length)}
          icon={<ShoppingBag size={18} />}
        />
        <StatCard label="Rata-rata Nilai Order" value={formatRupiah(avgOrderValue)} icon={<Receipt size={18} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={series} />
        </div>
        <TopProducts items={topProducts} />
      </div>

      <LowStockAlert items={lowStock} />
    </div>
  );
}
