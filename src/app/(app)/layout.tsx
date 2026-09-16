import { AppHeader } from "@/components/AppHeader";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let email: string | null = null;

  if (process.env.APP_UI_PREVIEW === "1") {
    email = "renan@exemplo.com";
  } else {
    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) redirect("/login");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    email = user.email ?? null;
  }

  return (
    <div className="min-h-screen">
      <AppHeader email={email} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
