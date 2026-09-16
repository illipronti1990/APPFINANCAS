import {
  DataTable,
  EmptyState,
  Kpi,
  PageTitle,
  StatusPill,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import { buildCashflowRows } from "@/lib/domain/compute";
import { formatCurrency, fullMonthLabel } from "@/lib/format";

export default async function FluxoPage() {
  const { bundle, source } = await loadBundle();
  const cf = bundle.cashflow;

  if (source === "empty" || !cf || cf.days.length === 0) {
    return (
      <div>
        <PageTitle
          eyebrow="Fluxo"
          title="Caixa diário"
          subtitle="Saldo inicial → entradas → saídas → saldo final → previsto."
        />
        <EmptyState
          title="Fluxo sem dados"
          text="Importe a planilha ou informe o saldo inicial e os dias do mês."
        />
      </div>
    );
  }

  const income = cf.days.reduce((s, d) => s + d.inflows, 0);
  const expenses = cf.days.reduce((s, d) => s + d.outflows, 0);
  const surplus = income - expenses;
  const rows = buildCashflowRows(cf.opening_balance, cf.days, surplus);

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Fluxo diário"
        title={`Caixa — ${fullMonthLabel(cf.month, cf.year)}`}
        subtitle="Linha vermelha = SEM CAIXA. Saldo previsto = final do dia + entradas restantes − saídas restantes."
      />

      <section className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Saldo inicial" value={formatCurrency(cf.opening_balance)} />
        <Kpi label="Entradas" value={formatCurrency(income)} tone="ok" />
        <Kpi label="Saídas" value={formatCurrency(expenses)} />
        <Kpi
          label="Saldo fim do mês"
          value={formatCurrency(surplus)}
          tone={surplus >= 0 ? "ok" : "danger"}
        />
      </section>

      <DataTable
        headers={[
          "Dia",
          "Saldo inicial",
          "Entradas",
          "Saídas",
          "Saldo final",
          "Previsto*",
          "Eventos",
          "Alerta",
        ]}
      >
        {rows.map((r) => (
          <tr
            key={r.id}
            className={r.alert ? "bg-danger-soft/40" : undefined}
          >
            <td className="px-3 py-2.5 font-medium">{r.day}</td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(r.opening)}
            </td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(r.inflows)}
            </td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(r.outflows)}
            </td>
            <td className="px-3 py-2.5 whitespace-nowrap font-medium">
              {formatCurrency(r.closing)}
            </td>
            <td className="px-3 py-2.5 whitespace-nowrap text-ink-muted">
              {formatCurrency(r.projected)}
            </td>
            <td className="max-w-[18rem] truncate px-3 py-2.5 text-xs text-ink-muted">
              {r.events || "—"}
            </td>
            <td className="px-3 py-2.5">
              {r.alert ? <StatusPill label={r.alert} tone="danger" /> : null}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
