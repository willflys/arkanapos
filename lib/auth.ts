import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export const HOME_BY_ROLE: Record<string, string> = {
  owner: "/dashboard",
  cashier: "/pos",
  barista: "/orders",
};

export async function getSessionProfile(): Promise<{ profile: Profile; userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return { profile: profile as Profile, userId: user.id };
}

export async function requireRole(allowed: Role[]) {
  const { profile, userId } = await getSessionProfile();
  if (!allowed.includes(profile.role)) {
    redirect(HOME_BY_ROLE[profile.role] ?? "/login");
  }
  return { profile, userId };
}
