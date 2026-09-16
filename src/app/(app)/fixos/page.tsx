import { toggleFixedPaid } from "@/app/actions";
import {
  deleteFixedExpense,
  upsertFixedExpense,
} from "@/app/actions/crud";
import {
  CheckField,
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
import { formatCurrency } from "@/lib/format";

export default async function FixosPage() {
  const { bundle, source } = await loadBundle();
  const items = bundle.fixedExpenses;
  const total = items.reduce((s, i) => s + i.amount, 0);
  const paid = items.filter((i) => i.paid).reduce((s, i) => s + i.amount, 0);
  const pending = total - paid;

  const addForm = (
    <CrudForm
      action={upsertFixedExpense}
      title="+ Adicionar despesa fixa"
      submitLabel="Salvar fixo"
      defaultOpen={source === "empty" || items.length === 0}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="account_name" label="Conta" required placeholder="Ex.: Internet" />
        <Field name="category" label="Categoria" defaultValue="Serviço" />
        <Field name="amount" label="Valor (R$)" type="number" step="0.01" min={0.01} required />
        <Field name="due_day" label="Dia venc." type="number" min={1} max={31} required defaultValue={5} />
        <Field name="bank" label="Banco/origem" />
        <Field name="until_when" label="Até quando" placeholder="Recorrente" />
        <Field name="notes" label="Observação" />
        <CheckField name="paid" label="Já pago neste mês" />
      </div>
    </CrudForm>
  );

  if (source === "empty" || items.length === 0) {
    return (
      <div className="space-y-6">
        <PageTitle
          eyebrow="Fixos"
          title="Despesas fixas recorrentes"
          subtitle="Dia de vencimento, banco, até quando e flag de pago."
        />
        <EmptyState title="Sem fixos" text="Importe a planilha ou adicione o primeiro item." />
        {addForm}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Fixos"
        title="Despesas fixas recorrentes"
        subtitle="Adicione, edite ou exclua. Marque pago quando quitar."
      />

      {addForm}

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
          "Ações",
        ]}
      >
        {items.map((item) => (
          <tr key={item.id} className="align-top">
            <td className="px-3 py-2.5 font-medium">
              {item.account_name}
              <EditForm action={upsertFixedExpense}>
                <input type="hidden" name="id" value={item.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field name="account_name" label="Conta" required defaultValue={item.account_name} />
                  <Field name="category" label="Categoria" defaultValue={item.category} />
                  <Field name="amount" label="Valor" type="number" step="0.01" required defaultValue={item.amount} />
                  <Field name="due_day" label="Dia" type="number" required defaultValue={item.due_day} />
                  <Field name="bank" label="Banco" defaultValue={item.bank ?? ""} />
                  <Field name="until_when" label="Até quando" defaultValue={item.until_when ?? ""} />
                  <Field name="notes" label="Obs" defaultValue={item.notes ?? ""} />
                  <CheckField name="paid" label="Pago" defaultChecked={item.paid} />
                </div>
              </EditForm>
            </td>
            <td className="px-3 py-2.5 text-ink-muted">{item.category}</td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(item.amount)}
            </td>
            <td className="px-3 py-2.5">{item.due_day}</td>
            <td className="px-3 py-2.5">{item.bank}</td>
            <td className="px-3 py-2.5">{item.until_when}</td>
            <td className="px-3 py-2.5">{item.paid ? "S" : "N"}</td>
            <td className="space-y-2 px-3 py-2.5">
              <form action={toggleFixedPaid}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="paid" value={String(item.paid)} />
                <button
                  type="submit"
                  className="block text-sm font-medium text-accent-deep hover:underline"
                >
                  {item.paid ? "Desmarcar" : "Marcar pago"}
                </button>
              </form>
              <DeleteButton
                action={deleteFixedExpense}
                id={item.id}
                confirmMessage={`Excluir o fixo "${item.account_name}"?`}
              />
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
