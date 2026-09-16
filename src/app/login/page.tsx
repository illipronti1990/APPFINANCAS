import { LoginForm } from "@/components/LoginForm";
import { getSupabaseEnv } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { isConfigured } = getSupabaseEnv();
  const params = await searchParams;
  const authError = params.error === "auth";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="reveal mb-8 text-center">
        <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-accent-deep sm:text-4xl">
          APPFINANCAS
        </p>
        <p className="mt-2 text-ink-muted">
          Seus gastos, dívidas, cartões e caixa — controladoria pessoal na nuvem.
        </p>
        <p className="mt-1 text-sm text-ink-muted">Renan Illipronti</p>
      </div>

      {authError ? (
        <p className="mb-4 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          Não foi possível concluir o login. Tente novamente.
        </p>
      ) : null}

      <div className="reveal reveal-delay-1">
        <LoginForm configured={isConfigured} />
      </div>
    </div>
  );
}
