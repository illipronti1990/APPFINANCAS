import Link from "next/link";
import { TransactionForm } from "@/components/TransactionForm";
import type { TransactionKind } from "@/lib/types";

export default async function NovaTransacaoPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const tipo =
    params.tipo === "deixei_de_gastar"
      ? ("deixei_de_gastar" as TransactionKind)
      : ("gasto" as TransactionKind);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href="/transacoes"
          className="text-sm text-ink-muted no-underline hover:text-accent-deep"
        >
          ← Voltar
        </Link>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold">
          Novo lançamento
        </h1>
        <p className="mt-2 text-ink-muted">
          Registre um gasto ou algo que você deixou de gastar.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface/90 p-5 shadow-sm sm:p-6">
        <TransactionForm mode="create" initial={{ kind: tipo }} />
      </div>
    </div>
  );
}
