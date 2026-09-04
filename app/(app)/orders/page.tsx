import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Orders } from "@/components/orders/Orders";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { profile } = await requireRole(["owner", "barista", "cashier"]);
  const supabase = await createClient();

  const since = new Date();
  since.setHours(since.getHours() - 12);

  const { data: orders } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  return <Orders orders={(orders ?? []) as Order[]} role={profile.role} />;
}
