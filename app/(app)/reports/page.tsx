import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Reports } from "@/components/reports/Reports";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

function rangeStart(range: string): string | null {
  const now = new Date();
  if (range === "today") {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (range === "7d") {
    now.setDate(now.getDate() - 7);
    return now.toISOString();
  }
  if (range === "30d") {
    now.setDate(now.getDate() - 30);
    return now.toISOString();
  }
  return null;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireRole(["owner"]);
  const supabase = await createClient();
  const { range = "7d" } = await searchParams;

  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  const start = rangeStart(range);
  if (start) query = query.gte("created_at", start);

  const { data: orders } = await query;

  return <Reports orders={(orders ?? []) as Order[]} range={range} />;
}
