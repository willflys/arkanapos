"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Coffee, Shield, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ArkanaLogo } from "@/components/ui/Logo";
import { Button, GlowOrb, Input } from "@/components/ui";
import { cn, ROLE_LABEL } from "@/lib/utils";
import type { Role } from "@/lib/types";

const ROLE_TABS: { value: Role; label: string; icon: typeof Shield }[] = [
  { value: "owner", label: "Owner", icon: Shield },
  { value: "barista", label: "Barista", icon: Coffee },
  { value: "cashier", label: "Cashier", icon: UserRound },
];

const HOME_BY_ROLE: Record<string, string> = {
  owner: "/dashboard",
  cashier: "/pos",
  barista: "/orders",
};

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Role>("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      toast.error("Email atau password salah.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .single();

    const actualRole = (profile?.role as Role) ?? "cashier";

    if (actualRole !== tab) {
      toast(`Akun ini terdaftar sebagai ${ROLE_LABEL[actualRole]}, bukan ${ROLE_LABEL[tab]}.`, { icon: "ℹ️" });
    } else {
      toast.success(`Selamat datang, ${profile?.full_name ?? "staff"}!`);
    }

    router.push(HOME_BY_ROLE[actualRole] ?? "/pos");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg px-4 py-10">
      <GlowOrb tone="violet" className="left-[-10%] top-[-10%] h-[420px] w-[420px]" />
      <GlowOrb tone="magenta" className="bottom-[-15%] right-[-10%] h-[380px] w-[380px]" />
      <GlowOrb tone="violet" className="left-1/2 top-1/3 h-[260px] w-[260px] -translate-x-1/2 opacity-30" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <ArkanaLogo size={56} />
          <h1 className="mt-4 text-2xl font-semibold">Arkana POS</h1>
          <p className="mt-1 text-sm text-text-muted">Masuk untuk mulai shift kamu</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface/80 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-5 grid grid-cols-3 gap-1.5 rounded-xl bg-surface-2/80 p-1">
            {ROLE_TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition-all",
                  tab === value
                    ? "bg-gradient-to-b from-violet-light to-violet text-white shadow-lg"
                    : "text-text-muted hover:text-white"
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@arkana.coffee"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : `Masuk sebagai ${ROLE_LABEL[tab]}`}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-text-faint">
          Akun staff dibuat oleh Owner melalui Supabase Dashboard.
        </p>
      </div>
    </div>
  );
}
