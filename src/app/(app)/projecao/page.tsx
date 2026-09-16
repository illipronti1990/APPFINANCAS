import {
  Bar,
  DataTable,
  EmptyState,
  Kpi,
  PageTitle,
  StatusPill,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import {
  incomeCommitmentTone,
  projectionRows,
  statusTone,
} from "@/lib/domain/compute";
import { formatCurrency, formatPercent, monthLabel } from "@/lib/format";

export default async function ProjecaoPage() {
  const { bundle, source } = await loadBundle();
  const rows = projectionRows(bundle.projections);

  if (source === "empty" || rows.length === 0) {
    return (
      <div>
        <PageTitle
          eyebrow="Projeção"
          title="Projeção financeira"
          subtitle="Compromissos × renda × % comprometida — 12 meses."
        />
        <EmptyState title="Sem projeção" text="Importe a planilha para ver o horizonte Jul–Jun." />
      </div>
    );
  }

  const avgPct =
    rows.reduce((s, r) => s + r.pct, 0) / Math.max(rows.length, 1);

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Projeção"
        title="Projeção financeira"
        subtitle="Edite compromissos/renda na planilha e reimporte. Saldo e % calculam sozinhos."
      />

      <Kpi
        label="Comprometimento médio da renda"
        value={formatPercent(avgPct)}
        tone={incomeCommitmentTone(avgPct) === "ok" ? "ok" : incomeCommitmentTone(avgPct) === "warn" ? "warn" : "danger"}
      />

      <DataTable
        headers={[
          "Mês",
          "Compromissos",
          "Renda",
          "Saldo",
          "% comprometida",
          "Situação",
          "Obs",
        ]}
      >
        {rows.map((r) => (
          <tr key={`${r.year}-${r.month}`}>
            <td className="px-3 py-2.5 font-medium">
              {monthLabel(r.month, r.year)}
            </td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(r.commitments)}
            </td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(r.income)}
            </td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(r.saldo)}
            </td>
            <td className="min-w-[8rem] px-3 py-2.5">
              <div className="mb-1 text-xs">{formatPercent(r.pct)}</div>
              <Bar
                pct={Math.min(r.pct, 100)}
                tone={incomeCommitmentTone(r.pct)}
              />
            </td>
            <td className="px-3 py-2.5">
              <StatusPill label={r.situacao} tone={statusTone(r.situacao)} />
            </td>
            <td className="max-w-[14rem] truncate px-3 py-2.5 text-xs text-ink-muted">
              {r.notes}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
