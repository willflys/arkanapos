"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Receipt as ReceiptIcon } from "lucide-react";
import { Button, Card, Badge, EmptyState } from "@/components/ui";
import { cn, formatDateTime, formatRupiah, ROLE_LABEL, STATUS_LABEL, STATUS_COLOR } from "@/lib/utils";
import type { Order } from "@/lib/types";

const RANGES = [
  { key: "today", label: "Hari Ini" },
  { key: "7d", label: "7 Hari" },
  { key: "30d", label: "30 Hari" },
  { key: "all", label: "Semua" },
] as const;

export function Reports({ orders, range }: { orders: Order[]; range: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paidOrders = orders.filter((o) => o.status !== "cancelled");
  const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);

  function setRange(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", key);
    router.push(`/reports?${params.toString()}`);
  }

  function exportCsv() {
    const header = ["No Order", "Waktu", "Meja", "Metode Bayar", "Status", "Total"];
    const rows = orders.map((o) => [
      o.order_number,
      formatDateTime(o.created_at),
      o.table_number || "Take Away",
      o.payment_method.toUpperCase(),
      STATUS_LABEL[o.status],
      o.total,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arkana-laporan-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">Laporan</h1>
          <p className="text-sm text-text-muted">Riwayat transaksi & ringkasan penjualan.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={exportCsv} disabled={orders.length === 0}>
          <Download size={14} /> Ekspor CSV
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-xl bg-surface-2 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors",
                range === r.key ? "bg-violet text-white" : "text-text-muted hover:text-white"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Card className="px-4 py-2">
          <span className="text-xs text-text-muted">Total pendapatan: </span>
          <span className="tabular text-sm font-semibold">{formatRupiah(totalRevenue)}</span>
        </Card>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<ReceiptIcon size={28} />} title="Belum ada transaksi" description="Transaksi pada periode ini akan muncul di sini." />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.3fr_1.4fr_1fr_1fr_1fr_1fr] gap-3 border-b border-border px-5 py-3 text-xs font-medium text-text-faint md:grid">
            <span>No Order</span>
            <span>Waktu</span>
            <span>Meja</span>
            <span>Bayar</span>
            <span>Status</span>
            <span className="text-right">Total</span>
          </div>
          <div className="divide-y divide-border">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/receipt/${o.id}`}
                className="grid grid-cols-2 gap-2 px-5 py-3.5 text-sm transition-colors hover:bg-white/[0.03] md:grid-cols-[1.3fr_1.4fr_1fr_1fr_1fr_1fr] md:items-center md:gap-3"
              >
                <span className="tabular font-medium">{o.order_number}</span>
                <span className="text-text-muted">{formatDateTime(o.created_at)}</span>
                <span className="text-text-muted">{o.table_number || "Take Away"}</span>
                <span className="uppercase text-text-muted">{o.payment_method}</span>
                <Badge className={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                <span className="tabular text-right font-medium md:text-right">{formatRupiah(o.total)}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
