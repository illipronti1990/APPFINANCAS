import { markParcelPaid } from "@/app/actions";
import {
  deleteInstallmentLoan,
  deleteLoanParcel,
  deleteOpenDebt,
  upsertInstallmentLoan,
  upsertLoanParcel,
  upsertOpenDebt,
} from "@/app/actions/crud";
import {
  CrudForm,
  DeleteButton,
  EditForm,
  Field,
} from "@/components/controladoria/CrudControls";
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

  const loanForm = (
    <CrudForm
      action={upsertInstallmentLoan}
      title="+ Adicionar empréstimo parcelado"
      submitLabel="Salvar empréstimo"
      defaultOpen={empty}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="bank" label="Banco" required />
        <Field name="balance" label="Saldo" type="number" step="0.01" required />
        <Field name="installment" label="Parcela/mês" type="number" step="0.01" required />
        <Field name="remaining" label="Restam (parcelas)" type="number" />
        <Field name="end_estimated" label="Fim estimado" placeholder="Jun/2028" />
        <Field name="status" label="Status" defaultValue="Em dia" />
      </div>
    </CrudForm>
  );

  const openForm = (
    <CrudForm
      action={upsertOpenDebt}
      title="+ Adicionar dívida em aberto / irregular"
      submitLabel="Salvar dívida"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="bank" label="Banco" required />
        <Field name="total_balance" label="Saldo total" type="number" step="0.01" required />
        <Field name="overdue" label="Atrasado" type="number" step="0.01" defaultValue={0} />
        <Field name="payoff_amount" label="Valor quitação" type="number" step="0.01" defaultValue={0} />
        <Field name="priority" label="Prioridade" type="number" />
        <Field name="status" label="Status" defaultValue="Em aberto" />
        <Field name="interest_rate_month" label="Juros % a.m." type="number" step="0.1" defaultValue={0} />
        <Field name="strategy" label="Estratégia / obs" />
      </div>
    </CrudForm>
  );

  if (empty) {
    return (
      <div className="space-y-6">
        <PageTitle
          eyebrow="Empréstimos"
          title="Empréstimos e pendências"
          subtitle="Parcelados, abertos/irregulares e cronograma Caixa PJ."
        />
        <EmptyState title="Sem empréstimos" text="Importe a planilha ou adicione o primeiro item." />
        {loanForm}
        {openForm}
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
        subtitle="Adicione, edite ou exclua. Atualize o saldo após cada pagamento."
      />

      {loanForm}
      {openForm}

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
          headers={["Banco", "Saldo", "Parcela/mês", "Restam", "Fim", "Status", "Ações"]}
        >
          {loans.map((l) => (
            <tr key={l.id} className="align-top">
              <td className="px-3 py-2.5 font-medium">
                {l.bank}
                <EditForm action={upsertInstallmentLoan}>
                  <input type="hidden" name="id" value={l.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field name="bank" label="Banco" required defaultValue={l.bank} />
                    <Field name="balance" label="Saldo" type="number" step="0.01" required defaultValue={l.balance} />
                    <Field name="installment" label="Parcela" type="number" step="0.01" required defaultValue={l.installment} />
                    <Field name="remaining" label="Restam" type="number" defaultValue={l.remaining ?? ""} />
                    <Field name="end_estimated" label="Fim" defaultValue={l.end_estimated ?? ""} />
                    <Field name="status" label="Status" defaultValue={l.status} />
                  </div>
                </EditForm>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(l.balance)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(l.installment)}</td>
              <td className="px-3 py-2.5">{l.remaining ?? "—"}</td>
              <td className="px-3 py-2.5">{l.end_estimated}</td>
              <td className="px-3 py-2.5">{l.status}</td>
              <td className="px-3 py-2.5">
                <DeleteButton
                  action={deleteInstallmentLoan}
                  id={l.id}
                  confirmMessage={`Excluir empréstimo "${l.bank}"?`}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
          A regularizar / quitar
        </h2>
        <DataTable
          headers={["Banco", "Saldo", "Atrasado", "Quitação", "Pri.", "Status", "Ações"]}
        >
          {open.map((d) => (
            <tr key={d.id} className="align-top">
              <td className="px-3 py-2.5 font-medium">
                {d.bank}
                <EditForm action={upsertOpenDebt}>
                  <input type="hidden" name="id" value={d.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field name="bank" label="Banco" required defaultValue={d.bank} />
                    <Field name="total_balance" label="Saldo" type="number" step="0.01" required defaultValue={d.total_balance} />
                    <Field name="overdue" label="Atrasado" type="number" step="0.01" defaultValue={d.overdue} />
                    <Field name="payoff_amount" label="Quitação" type="number" step="0.01" defaultValue={d.payoff_amount} />
                    <Field name="priority" label="Prioridade" type="number" defaultValue={d.priority ?? ""} />
                    <Field name="status" label="Status" defaultValue={d.status} />
                    <Field name="interest_rate_month" label="Juros % a.m." type="number" step="0.1" defaultValue={d.interest_rate_month ?? 0} />
                    <Field name="strategy" label="Estratégia" defaultValue={d.strategy ?? ""} />
                  </div>
                </EditForm>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(d.total_balance)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(d.overdue)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(d.payoff_amount)}</td>
              <td className="px-3 py-2.5">{d.priority ?? "—"}</td>
              <td className="px-3 py-2.5">{d.status}</td>
              <td className="px-3 py-2.5">
                <DeleteButton
                  action={deleteOpenDebt}
                  id={d.id}
                  confirmMessage={`Excluir dívida "${d.bank}"?`}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
            Caixa PJ — cronograma
          </h2>
          {nextParcel ? (
            <p className="text-sm text-ink-muted">
              Próxima c/ juros:{" "}
              <strong>{formatCurrency(nextParcel.amount_with_interest)}</strong>
            </p>
          ) : null}
        </div>

        <CrudForm action={upsertLoanParcel} title="+ Adicionar parcela" submitLabel="Salvar parcela">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="parcel_index" label="#" type="number" required />
            <Field name="parcel_number" label="Nº parcela" type="number" defaultValue={0} />
            <Field name="amount" label="Valor" type="number" step="0.01" required />
            <Field name="amount_with_interest" label="Valor c/ juros" type="number" step="0.01" required />
            <Field name="situation" label="Situação" defaultValue="Não Paga" />
            <Field name="debt_label" label="Rótulo" defaultValue="Caixa PJ" />
          </div>
        </CrudForm>

        <DataTable headers={["#", "Nº", "Situação", "Valor", "C/ juros", "Ações"]}>
          {parcels.map((p) => (
            <tr key={p.id} className="align-top">
              <td className="px-3 py-2.5">{p.parcel_index}</td>
              <td className="px-3 py-2.5">{p.parcel_number}</td>
              <td className="px-3 py-2.5">{p.situation}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(p.amount)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(p.amount_with_interest)}
              </td>
              <td className="space-y-2 px-3 py-2.5">
                {p.situation !== "Pago" ? (
                  <form action={markParcelPaid}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="block text-sm font-medium text-accent-deep hover:underline"
                    >
                      Marcar pago
                    </button>
                  </form>
                ) : (
                  <span className="text-sm text-accent-deep">✓ Pago</span>
                )}
                <DeleteButton
                  action={deleteLoanParcel}
                  id={p.id}
                  confirmMessage={`Excluir parcela #${p.parcel_index}?`}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
