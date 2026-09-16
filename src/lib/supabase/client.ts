import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./config";

export function createClient() {
  const { url, anonKey, isConfigured } = getSupabaseEnv();
  if (!isConfigured) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local",
    );
  }
  return createBrowserClient(url, anonKey);
}
