export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

  return {
    url,
    anonKey,
    siteUrl,
    isConfigured: Boolean(url && anonKey),
  };
}
