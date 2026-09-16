import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CategoryBars,
  DashboardSummary,
  TrendList,
} from "@/components/DashboardCards";
import { currentMonthRange, formatMonthYear } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/types";
import Link from "next/link";

function sumByKind(rows: Transaction[], kind: Transaction["kind"]) {
  return rows
    .filter((row) => row.kind === kind)
    .reduce((acc, row) => acc + Number(row.amount), 0);
}

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

export default async function DashboardPage() {
  const supabase = await createClient();
  const { start, end } = currentMonthRange();
  const trendStart = format(subMonths(new Date(), 5), "yyyy-MM-01");

  const [{ data: monthRows }, { data: trendRows }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .gte("occurred_on", start)
      .lte("occurred_on", end)
      .order("occurred_on", { ascending: false }),
    supabase
      .from("transactions")
      .select("*")
      .gte("occurred_on", trendStart)
      .order("occurred_on", { ascending: true }),
  ]);

  const monthTx = (monthRows ?? []) as Transaction[];
  const trendTx = (trendRows ?? []) as Transaction[];

  const gasto = sumByKind(monthTx, "gasto");
  const evitado = sumByKind(monthTx, "deixei_de_gastar");
  const gastoCats = groupByCategory(monthTx, "gasto");
  const eviteiCats = groupByCategory(monthTx, "deixei_de_gastar");

  const monthMap = new Map<
    string,
    { key: string; label: string; gasto: number; evitado: number }
  >();

  for (let i = 5; i >= 0; i -= 1) {
    const d = subMonths(new Date(), i);
    const key = format(d, "yyyy-MM");
    const label = format(d, "MMM yyyy", { locale: ptBR });
    monthMap.set(key, {
      key,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      gasto: 0,
      evitado: 0,
    });
  }

  for (const row of trendTx) {
    const key = row.occurred_on.slice(0, 7);
    const bucket = monthMap.get(key);
    if (!bucket) continue;
    if (row.kind === "gasto") bucket.gasto += Number(row.amount);
    else bucket.evitado += Number(row.amount);
  }

  const hasAny = trendTx.length > 0;

  return (
    <div className="space-y-8">
      <div className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-deep">
            Painel
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
            {formatMonthYear()}
          </h1>
          <p className="mt-2 max-w-xl text-ink-muted">
            Compare o que saiu da conta e o que você conseguiu evitar neste mês.
          </p>
        </div>
        <Link
          href="/transacoes/nova"
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-accent-deep"
        >
          + Novo lançamento
        </Link>
      </div>

      <DashboardSummary
        gasto={gasto}
        evitado={evitado}
        monthLabel={formatMonthYear()}
      />

      {!hasAny ? (
        <div className="reveal rounded-2xl border border-dashed border-line bg-surface/70 px-5 py-8 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
            Seu painel está pronto
          </p>
          <p className="mt-2 text-ink-muted">
            Ainda não há lançamentos. Quando você registrar gastos e o que deixou
            de gastar, os totais e gráficos aparecem aqui.
          </p>
        </div>
      ) : null}

      <div className="reveal reveal-delay-1 grid gap-4 lg:grid-cols-2">
        <CategoryBars title="Gastos por categoria" items={gastoCats} total={gasto} />
        <CategoryBars
          title="Deixei de gastar por motivo"
          items={eviteiCats}
          total={evitado}
        />
      </div>

      <div className="reveal reveal-delay-2">
        <TrendList months={[...monthMap.values()].filter((m) => m.gasto + m.evitado > 0)} />
      </div>
    </div>
  );
}
