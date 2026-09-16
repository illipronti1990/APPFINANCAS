import {
  DataTable,
  EmptyState,
  PageTitle,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import { formatCurrency, monthLabel } from "@/lib/format";

export default async function ContasPage() {
  const { bundle, source } = await loadBundle();
  const rows = bundle.billMatrix;
  const months =
    rows[0]?.amounts.map((a) => ({ year: a.year, month: a.month })) ?? [];

  if (source === "empty" || rows.length === 0) {
    return (
      <div>
        <PageTitle
          eyebrow="Contas"
          title="Contas a pagar (matriz)"
          subtitle="Conta × dia × meses à frente — como Contas_Ago_Jan."
        />
        <EmptyState
          title="Matriz vazia"
          text="Importe a planilha para carregar a consolidação multi-mês."
        />
      </div>
    );
  }

  const totals = months.map((m) =>
    rows.reduce((s, r) => {
      const hit = r.amounts.find((a) => a.month === m.month && a.year === m.year);
      return s + (hit?.amount ?? 0);
    }, 0),
  );

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Contas"
        title="Contas a pagar — matriz multi-mês"
        subtitle="Consolidação de fixos, parcelas e cartões. Fonte e observações por conta."
      />

      <DataTable
        headers={[
          "Conta",
          "Dia",
          ...months.map((m) => monthLabel(m.month, m.year)),
          "Total",
          "Fonte",
          "Pago",
          "Obs",
        ]}
      >
        {rows.map((row) => {
          const total = row.amounts.reduce((s, a) => s + a.amount, 0);
          return (
            <tr key={row.id}>
              <td className="px-3 py-2.5 font-medium">{row.account_name}</td>
              <td className="px-3 py-2.5">{row.due_day}</td>
              {months.map((m) => {
                const hit = row.amounts.find(
                  (a) => a.month === m.month && a.year === m.year,
                );
                return (
                  <td key={`${m.year}-${m.month}`} className="px-3 py-2.5 whitespace-nowrap">
                    {formatCurrency(hit?.amount ?? 0)}
                  </td>
                );
              })}
              <td className="px-3 py-2.5 whitespace-nowrap font-semibold">
                {formatCurrency(total)}
              </td>
              <td className="px-3 py-2.5 text-ink-muted">{row.source}</td>
              <td className="px-3 py-2.5">{row.paid ? "S" : "N"}</td>
              <td className="max-w-[14rem] truncate px-3 py-2.5 text-xs text-ink-muted">
                {row.notes}
              </td>
            </tr>
          );
        })}
        <tr className="bg-bg-soft/60 font-semibold">
          <td className="px-3 py-2.5" colSpan={2}>
            TOTAL / MÊS
          </td>
          {totals.map((t, i) => (
            <td key={i} className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(t)}
            </td>
          ))}
          <td className="px-3 py-2.5 whitespace-nowrap">
            {formatCurrency(totals.reduce((a, b) => a + b, 0))}
          </td>
          <td colSpan={3} />
        </tr>
      </DataTable>
    </div>
  );
}
