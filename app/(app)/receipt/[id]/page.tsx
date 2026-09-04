import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import { ReceiptActions } from "@/components/receipt/ReceiptActions";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await getSessionProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*), creator:profiles!orders_created_by_fkey(full_name)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const typedOrder = order as unknown as Order & { creator?: { full_name: string } };

  return (
    <div className="flex min-h-dvh flex-col items-center bg-bg px-4 py-8">
      <div className="mb-5 flex w-full max-w-sm items-center justify-between">
        <Link href="/pos" className="text-sm text-text-muted hover:text-white">
          ← Kembali
        </Link>
        <ReceiptActions />
      </div>

      <div id="receipt-print" className="w-full max-w-sm rounded-2xl bg-white p-6 font-mono text-black shadow-2xl">
        <div className="mb-4 text-center">
          <p className="text-lg font-bold tracking-wide">ARKANA COFFEE</p>
          <p className="text-xs">Jl. Kopi Nikmat No. 1</p>
        </div>
        <div className="my-3 border-t border-dashed border-black/40" />
        <div className="space-y-0.5 text-xs">
          <Row label="No. Order" value={typedOrder.order_number} />
          <Row label="Waktu" value={formatDateTime(typedOrder.created_at)} />
          <Row label="Meja" value={typedOrder.table_number || "Take Away"} />
          <Row label="Kasir" value={typedOrder.creator?.full_name ?? "-"} />
        </div>
        <div className="my-3 border-t border-dashed border-black/40" />
        <div className="space-y-1.5 text-xs">
          {typedOrder.items?.map((it) => (
            <div key={it.id} className="flex justify-between gap-2">
              <span className="flex-1">
                {it.product_name}
                <br />
                <span className="text-black/60">
                  {it.quantity} x {formatRupiah(it.price)}
                </span>
              </span>
              <span className="shrink-0 font-medium">{formatRupiah(it.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="my-3 border-t border-dashed border-black/40" />
        <div className="space-y-1 text-xs">
          <Row label="Subtotal" value={formatRupiah(typedOrder.subtotal)} />
          <div className="flex justify-between text-sm font-bold">
            <span>TOTAL</span>
            <span>{formatRupiah(typedOrder.total)}</span>
          </div>
          <Row label="Bayar" value={typedOrder.payment_method.toUpperCase()} />
        </div>
        <div className="my-3 border-t border-dashed border-black/40" />
        <p className="text-center text-xs">Terima kasih sudah mampir ✦</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-black/60">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
