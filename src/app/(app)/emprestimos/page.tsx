import { markParcelPaid } from "@/app/actions";
import {
  DataTable,
  EmptyState,
  Kpi,
  PageTitle,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import { totalDebts } from "@/lib/domain/compute";
import { formatCurrency } from "@/lib/format";

export default async function EmprestimosPage() {
  const { bundle, source } = await loadBundle();
  const loans = bundle.installmentLoans;
  const open = bundle.openDebts;
  const parcels = bundle.loanParcels;
  const empty = source === "empty" || (loans.length === 0 && open.length === 0);

  if (empty) {
    return (
      <div>
        <PageTitle
          eyebrow="Empréstimos"
          title="Empréstimos e pendências"
          subtitle="Parcelados, abertos/irregulares e cronograma Caixa PJ."
        />
        <EmptyState title="Sem empréstimos" text="Importe a planilha para carregar saldos e cronogramas." />
      </div>
    );
  }

  const parceladas = loans.reduce((s, l) => s + l.balance, 0);
  const abertas = open.reduce((s, d) => s + d.total_balance, 0);
  const nextParcel = parcels.find((p) => p.situation !== "Pago");

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow="Empréstimos"
        title="Controle individual"
        subtitle="Restam ≈ saldo/parcela. Atualize o saldo após cada pagamento."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Parceladas" value={formatCurrency(parceladas)} />
        <Kpi label="Em aberto" value={formatCurrency(abertas)} tone="danger" />
        <Kpi
          label="Dívidas totais"
          value={formatCurrency(totalDebts(bundle))}
          hint="Sem consignado"
        />
      </section>

      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
          Com parcela mensal definida
        </h2>
        <DataTable
          headers={["Banco", "Saldo", "Parcela/mês", "Restam", "Fim estimado", "Status"]}
        >
          {loans.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2.5 font-medium">{l.bank}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(l.balance)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(l.installment)}
              </td>
              <td className="px-3 py-2.5">{l.remaining ?? "—"}</td>
              <td className="px-3 py-2.5">{l.end_estimated}</td>
              <td className="px-3 py-2.5">{l.status}</td>
            </tr>
          ))}
        </DataTable>
      </div>

      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
          A regularizar / quitar
        </h2>
        <DataTable
          headers={[
            "Banco",
            "Saldo",
            "Atrasado",
            "Quitação",
            "Prioridade",
            "Status",
            "Estratégia",
          ]}
        >
          {open.map((d) => (
            <tr key={d.id}>
              <td className="px-3 py-2.5 font-medium">{d.bank}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(d.total_balance)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(d.overdue)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(d.payoff_amount)}
              </td>
              <td className="px-3 py-2.5">{d.priority ?? "—"}</td>
              <td className="px-3 py-2.5">{d.status}</td>
              <td className="max-w-[16rem] truncate px-3 py-2.5 text-xs text-ink-muted">
                {d.strategy}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {parcels.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
              Caixa PJ — cronograma (pagar 1 a 1)
            </h2>
            {nextParcel ? (
              <p className="text-sm text-ink-muted">
                Próxima c/ juros:{" "}
                <strong>{formatCurrency(nextParcel.amount_with_interest)}</strong>
              </p>
            ) : null}
          </div>
          <DataTable
            headers={["#", "Nº", "Situação", "Valor", "Valor c/ juros", ""]}
          >
            {parcels.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2.5">{p.parcel_index}</td>
                <td className="px-3 py-2.5">{p.parcel_number}</td>
                <td className="px-3 py-2.5">{p.situation}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatCurrency(p.amount)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatCurrency(p.amount_with_interest)}
                </td>
                <td className="px-3 py-2.5">
                  {p.situation !== "Pago" ? (
                    <form action={markParcelPaid}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-accent-deep hover:underline"
                      >
                        Marcar pago
                      </button>
                    </form>
                  ) : (
                    "✓"
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      ) : null}
    </div>
  );
}
