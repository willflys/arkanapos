import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Inventory } from "@/components/inventory/Inventory";
import type { Product, Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const { profile } = await requireRole(["owner", "cashier"]);
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, inventory(*), category:categories(*)").order("name"),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  return (
    <Inventory
      products={(products ?? []) as Product[]}
      categories={(categories ?? []) as Category[]}
      role={profile.role}
    />
  );
}
