import { redirect } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (process.env.APP_UI_PREVIEW === "1") redirect("/inicio");
  const { isConfigured } = getSupabaseEnv();
  if (!isConfigured) redirect("/login");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(user ? "/inicio" : "/login");
}
