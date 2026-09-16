import Link from "next/link";
import { CategoryBars } from "@/components/DashboardCards";
import { currentMonthRange, formatCurrency, formatMonthYear } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/types";

function groupByCategory(rows: Transaction[], kind: Transaction["kind"]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.kind !== kind) continue;
    map.set(row.category, (map.get(row.category) ?? 0) + Number(row.amount));
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { start, end } = currentMonthRange();

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .gte("occurred_on", start)
    .lte("occurred_on", end);

  const rows = (data ?? []) as Transaction[];
  const gastoCats = groupByCategory(rows, "gasto");
  const eviteiCats = groupByCategory(rows, "deixei_de_gastar");
  const gastoTotal = gastoCats.reduce((a, b) => a + b.total, 0);
  const eviteiTotal = eviteiCats.reduce((a, b) => a + b.total, 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-deep">
          Categorias
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold">
          Detalhe de {formatMonthYear()}
        </h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Veja para onde o dinheiro foi e onde você conseguiu segurar o impulso.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface/90 p-5">
          <p className="text-sm text-ink-muted">Total em gastos</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold">
            {formatCurrency(gastoTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface/90 p-5">
          <p className="text-sm text-ink-muted">Total deixei de gastar</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-accent-deep">
            {formatCurrency(eviteiTotal)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBars title="Gastos" items={gastoCats} total={gastoTotal} />
        <CategoryBars
          title="Deixei de gastar"
          items={eviteiCats}
          total={eviteiTotal}
        />
      </div>

      <div className="text-center">
        <Link
          href="/transacoes/nova"
          className="inline-flex rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-accent-deep"
        >
          Adicionar lançamento
        </Link>
      </div>
    </div>
  );
}
