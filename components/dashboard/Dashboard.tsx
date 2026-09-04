"use client";

import type { ReactNode } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, PackageX, Flame } from "lucide-react";
import { Card, GlowOrb } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  icon,
  glow = false,
}: {
  label: string;
  value: string;
  delta?: number | null;
  icon: ReactNode;
  glow?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      {glow && <GlowOrb tone="violet" className="right-[-40px] top-[-40px] h-32 w-32" />}
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted">{label}</p>
          <p className="tabular mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-xl bg-violet/15 p-2.5 text-violet-light">
          {icon}
        </div>
      </div>
      {delta !== undefined && delta !== null && (
        <div
          className={`relative mt-3 inline-flex items-center gap-1 text-xs font-medium ${
            delta >= 0 ? "text-success" : "text-danger"
          }`}
        >
          {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(delta).toFixed(0)}% vs kemarin
        </div>
      )}
    </Card>
  );
}

export function RevenueChart({ data }: { data: { label: string; total: number }[] }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Pendapatan 7 Hari Terakhir</p>
          <p className="text-xs text-text-muted">Total penjualan per hari</p>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -10, right: 10, top: 10 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9163ff" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#9163ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2660" vertical={false} />
            <XAxis dataKey="label" stroke="#6c6598" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#6c6598"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}rb` : v)}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1740",
                border: "1px solid #2a2660",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value) => [formatRupiah(Number(value)), "Pendapatan"]}
            />
            <Area type="monotone" dataKey="total" stroke="#9163ff" strokeWidth={2.5} fill="url(#revenueFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function TopProducts({ items }: { items: { name: string; qty: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.qty));
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Flame size={16} className="text-magenta" />
        <p className="text-sm font-semibold">Menu Terlaris (7 hari)</p>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-faint">Belum ada penjualan.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 truncate">
                  <span className="text-text-faint">{i + 1}.</span> {item.name}
                </span>
                <span className="tabular text-text-muted">{item.qty}x</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet to-magenta"
                  style={{ width: `${(item.qty / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function LowStockAlert({
  items,
}: {
  items: { name: string; stock: number; unit: string; threshold: number }[];
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <PackageX size={16} className="text-warning" />
        <p className="text-sm font-semibold">Stok Menipis</p>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-faint">Semua stok aman 👍</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-xl border border-warning/20 bg-warning/5 px-3.5 py-2.5"
            >
              <span className="text-sm">{item.name}</span>
              <span className="tabular text-xs font-semibold text-warning">
                {item.stock} {item.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
