import { notFound } from "next/navigation";
import {
  CategoryBars,
  DashboardSummary,
  TrendList,
} from "@/components/DashboardCards";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { AppHeader } from "@/components/AppHeader";
import { formatMonthYear } from "@/lib/format";

/**
 * Pré-visualização visual sem Supabase (apenas com APP_UI_PREVIEW=1).
 * Mostra estado vazio — não inventa histórico financeiro.
 */
export const dynamic = "force-dynamic";

export default function PreviewPage() {
  if (process.env.APP_UI_PREVIEW !== "1") {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <AppHeader email="renan@exemplo.com" />
      <main className="mx-auto w-full max-w-5xl space-y-12 px-4 py-6 sm:px-6 sm:py-8">
        <section id="painel" className="space-y-8">
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
          <DashboardSummary
            gasto={0}
            evitado={0}
            monthLabel={formatMonthYear()}
          />
          <div className="rounded-2xl border border-dashed border-line bg-surface/70 px-5 py-8 text-center">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
              Seu painel está pronto
            </p>
            <p className="mt-2 text-ink-muted">
              Ainda não há lançamentos. Quando você registrar gastos e o que
              deixou de gastar, os totais e gráficos aparecem aqui.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryBars title="Gastos por categoria" items={[]} total={0} />
            <CategoryBars
              title="Deixei de gastar por motivo"
              items={[]}
              total={0}
            />
          </div>
          <TrendList months={[]} />
        </section>

        <section id="novo" className="mx-auto max-w-xl space-y-6">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
              Novo lançamento
            </h1>
            <p className="mt-2 text-ink-muted">
              Registre um gasto ou algo que você deixou de gastar.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface/90 p-5 shadow-sm sm:p-6">
            <TransactionForm mode="create" initial={{ kind: "gasto" }} />
          </div>
        </section>

        <section id="lista" className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Lançamentos
          </h2>
          <TransactionList transactions={[]} />
        </section>
      </main>
    </div>
  );
}
