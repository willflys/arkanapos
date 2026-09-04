"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Clock, ArrowRight, XCircle, Utensils } from "lucide-react";
import { Card, Button, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/app/actions";
import { formatTime } from "@/lib/utils";
import type { Order, OrderStatus, Role } from "@/lib/types";

const COLUMNS: { status: OrderStatus; label: string; next?: OrderStatus; nextLabel?: string }[] = [
  { status: "pending", label: "Menunggu", next: "preparing", nextLabel: "Mulai Proses" },
  { status: "preparing", label: "Diproses", next: "ready", nextLabel: "Siap Diantar" },
  { status: "ready", label: "Siap Diantar", next: "completed", nextLabel: "Selesai" },
];

export function Orders({ orders, role }: { orders: Order[]; role: Role }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  function handleUpdate(orderId: string, status: OrderStatus) {
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, status);
      if (res.error) toast.error(res.error);
    });
  }

  const active = orders.filter((o) => !["completed", "cancelled"].includes(o.status));

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">Antrian Order</h1>
          <p className="text-sm text-text-muted">Update status pesanan secara real-time.</p>
        </div>
      </div>

      {active.length === 0 ? (
        <EmptyState icon={<Utensils size={28} />} title="Belum ada order aktif" description="Order baru dari Kasir akan muncul di sini." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colOrders = active.filter((o) => o.status === col.status);
            return (
              <div key={col.status}>
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full bg-violet-light" />
                  <p className="text-sm font-semibold">{col.label}</p>
                  <span className="tabular text-xs text-text-faint">{colOrders.length}</span>
                </div>
                <div className="space-y-3">
                  {colOrders.map((order) => (
                    <Card key={order.id} className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <p className="tabular text-sm font-semibold">{order.order_number}</p>
                          <p className="text-xs text-text-muted">{order.table_number || "Take Away"}</p>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] text-text-faint">
                          <Clock size={12} /> {formatTime(order.created_at)}
                        </span>
                      </div>
                      <ul className="mb-3 space-y-1 border-t border-border pt-2 text-xs text-text-muted">
                        {order.items?.map((it) => (
                          <li key={it.id} className="flex justify-between">
                            <span className="truncate pr-2">
                              {it.quantity}x {it.product_name}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2">
                        {col.next && (
                          <Button
                            size="sm"
                            className="flex-1"
                            disabled={isPending}
                            onClick={() => handleUpdate(order.id, col.next!)}
                          >
                            {col.nextLabel} <ArrowRight size={14} />
                          </Button>
                        )}
                        {col.status === "pending" && role === "owner" && (
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={isPending}
                            onClick={() => handleUpdate(order.id, "cancelled")}
                          >
                            <XCircle size={14} />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                  {colOrders.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-text-faint">
                      Kosong
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
