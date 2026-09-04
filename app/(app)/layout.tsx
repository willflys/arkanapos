import { getSessionProfile } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getSessionProfile();

  return (
    <AppShell role={profile.role} fullName={profile.full_name}>
      {children}
    </AppShell>
  );
}
