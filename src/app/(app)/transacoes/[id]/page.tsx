import Link from "next/link";
import { notFound } from "next/navigation";
import { TransactionForm } from "@/components/TransactionForm";
import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/types";

export default async function EditarTransacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const transaction = data as Transaction;

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
          Editar lançamento
        </h1>
      </div>

      <div className="rounded-2xl border border-line bg-surface/90 p-5 shadow-sm sm:p-6">
        <TransactionForm mode="edit" initial={transaction} />
      </div>
    </div>
  );
}
