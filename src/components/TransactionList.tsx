import Link from "next/link";
import { DeleteTransactionButton } from "@/components/TransactionForm";
import { formatCurrency, formatDate } from "@/lib/format";
import { kindLabel, type Transaction } from "@/lib/types";

export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/70 px-5 py-10 text-center">
        <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
          Nenhum lançamento ainda
        </p>
        <p className="mt-2 text-ink-muted">
          Comece registrando um gasto ou algo que você deixou de gastar.
        </p>
        <Link
          href="/transacoes/nova"
          className="mt-5 inline-flex rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-accent-deep"
        >
          Adicionar lançamento
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {transactions.map((tx) => (
        <li
          key={tx.id}
          className="rounded-2xl border border-line bg-surface/90 px-4 py-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-deep">
                {kindLabel(tx.kind)}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold">
                {formatCurrency(Number(tx.amount))}
              </p>
              <p className="mt-1 text-ink-muted">
                {tx.category} · {formatDate(tx.occurred_on)}
              </p>
              {tx.note ? (
                <p className="mt-2 text-sm text-ink-muted">{tx.note}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/transacoes/${tx.id}`}
                className="text-sm font-medium text-accent-deep no-underline hover:underline"
              >
                Editar
              </Link>
              <DeleteTransactionButton id={tx.id} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
