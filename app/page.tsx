import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const HOME_BY_ROLE: Record<string, string> = {
  owner: "/dashboard",
  cashier: "/pos",
  barista: "/orders",
};

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  redirect(HOME_BY_ROLE[profile?.role ?? "cashier"] ?? "/pos");
}
