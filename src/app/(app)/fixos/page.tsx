import { toggleFixedPaid } from "@/app/actions";
import {
  DataTable,
  EmptyState,
  Kpi,
  PageTitle,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import { formatCurrency } from "@/lib/format";

export default async function FixosPage() {
  const { bundle, source } = await loadBundle();
  const items = bundle.fixedExpenses;
  const total = items.reduce((s, i) => s + i.amount, 0);
  const paid = items.filter((i) => i.paid).reduce((s, i) => s + i.amount, 0);
  const pending = total - paid;

  if (source === "empty" || items.length === 0) {
    return (
      <div>
        <PageTitle
          eyebrow="Fixos"
          title="Despesas fixas recorrentes"
          subtitle="Dia de vencimento, banco, até quando e flag de pago."
        />
        <EmptyState title="Sem fixos" text="Importe a planilha para carregar as despesas recorrentes." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Fixos"
        title="Despesas fixas recorrentes"
        subtitle="Marque pago quando quitar. Vencimentos alinhados à matriz de Contas."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Total do mês" value={formatCurrency(total)} />
        <Kpi label="Já pagos" value={formatCurrency(paid)} tone="ok" />
        <Kpi label="Pendentes" value={formatCurrency(pending)} tone="warn" />
      </section>

      <DataTable
        headers={[
          "Conta",
          "Categoria",
          "Valor",
          "Dia",
          "Banco",
          "Até quando",
          "Pago",
          "Obs",
          "",
        ]}
      >
        {items.map((item) => (
          <tr key={item.id}>
            <td className="px-3 py-2.5 font-medium">{item.account_name}</td>
            <td className="px-3 py-2.5 text-ink-muted">{item.category}</td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(item.amount)}
            </td>
            <td className="px-3 py-2.5">{item.due_day}</td>
            <td className="px-3 py-2.5">{item.bank}</td>
            <td className="px-3 py-2.5">{item.until_when}</td>
            <td className="px-3 py-2.5">{item.paid ? "S" : "N"}</td>
            <td className="max-w-[12rem] truncate px-3 py-2.5 text-xs text-ink-muted">
              {item.notes}
            </td>
            <td className="px-3 py-2.5">
              <form action={toggleFixedPaid}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="paid" value={String(item.paid)} />
                <button
                  type="submit"
                  className="text-sm font-medium text-accent-deep hover:underline"
                >
                  {item.paid ? "Desmarcar" : "Marcar pago"}
                </button>
              </form>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
