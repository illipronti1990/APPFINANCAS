import Link from "next/link";
import { TransactionList } from "@/components/TransactionList";
import { createClient } from "@/lib/supabase/server";
import type { Transaction, TransactionKind } from "@/lib/types";

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const tipo = params.tipo;
  const filter: TransactionKind | null =
    tipo === "gasto" || tipo === "deixei_de_gastar" ? tipo : null;

  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (filter) {
    query = query.eq("kind", filter);
  }

  const { data } = await query;
  const transactions = (data ?? []) as Transaction[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-deep">
            Lançamentos
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold">
            Histórico
          </h1>
        </div>
        <Link
          href="/transacoes/nova"
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-accent-deep"
        >
          + Novo
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip href="/transacoes" active={!filter} label="Todos" />
        <FilterChip
          href="/transacoes?tipo=gasto"
          active={filter === "gasto"}
          label="Gastos"
        />
        <FilterChip
          href="/transacoes?tipo=deixei_de_gastar"
          active={filter === "deixei_de_gastar"}
          label="Deixei de gastar"
        />
      </div>

      <TransactionList transactions={transactions} />
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-medium no-underline transition ${
        active
          ? "bg-accent text-white"
          : "border border-line text-ink-muted hover:bg-accent-soft"
      }`}
    >
      {label}
    </Link>
  );
}
