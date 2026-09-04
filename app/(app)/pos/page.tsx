import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { POS } from "@/components/pos/POS";
import type { Product, Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  await requireRole(["owner", "cashier"]);
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, inventory(*), category:categories(*)")
      .eq("is_active", true)
      .order("name"),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  return <POS products={(products ?? []) as Product[]} categories={(categories ?? []) as Category[]} />;
}
