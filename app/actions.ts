"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CartLine, OrderStatus, PaymentMethod } from "@/lib/types";

export async function checkoutOrder(
  tableNumber: string,
  paymentMethod: PaymentMethod,
  cart: CartLine[]
) {
  const supabase = await createClient();

  const items = cart.map((line) => ({
    product_id: line.product.id,
    product_name: line.product.name,
    price: line.product.price,
    quantity: line.quantity,
    notes: line.notes,
    subtotal: line.product.price * line.quantity,
  }));

  const { data, error } = await supabase.rpc("create_order", {
    p_table_number: tableNumber,
    p_payment_method: paymentMethod,
    p_items: items,
  });

  if (error) return { error: error.message };

  revalidatePath("/pos");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/inventory");

  return { orderId: data as string };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "completed") patch.completed_at = new Date().toISOString();

  const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
  if (error) return { error: error.message };

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function adjustStock(productId: string, stockQty: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory")
    .update({ stock_qty: stockQty, updated_at: new Date().toISOString() })
    .eq("product_id", productId);

  if (error) return { error: error.message };

  revalidatePath("/inventory");
  revalidatePath("/pos");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function upsertProduct(input: {
  id?: string;
  name: string;
  price: number;
  categoryId: string | null;
  stockQty: number;
  unit: string;
  lowStockThreshold: number;
}) {
  const supabase = await createClient();

  if (input.id) {
    const { error } = await supabase
      .from("products")
      .update({ name: input.name, price: input.price, category_id: input.categoryId })
      .eq("id", input.id);
    if (error) return { error: error.message };

    await supabase
      .from("inventory")
      .update({
        stock_qty: input.stockQty,
        unit: input.unit,
        low_stock_threshold: input.lowStockThreshold,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", input.id);
  } else {
    const { data: product, error } = await supabase
      .from("products")
      .insert({ name: input.name, price: input.price, category_id: input.categoryId })
      .select()
      .single();
    if (error) return { error: error.message };

    await supabase.from("inventory").insert({
      product_id: product.id,
      stock_qty: input.stockQty,
      unit: input.unit,
      low_stock_threshold: input.lowStockThreshold,
    });
  }

  revalidatePath("/inventory");
  revalidatePath("/pos");
  return { ok: true };
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath("/inventory");
  revalidatePath("/pos");
  return { ok: true };
}

export async function createCategory(name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name, sort_order: 99 });
  if (error) return { error: error.message };

  revalidatePath("/inventory");
  revalidatePath("/pos");
  return { ok: true };
}
