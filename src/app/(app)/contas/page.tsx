import {
  deleteBillMatrixRow,
  upsertBillMatrixRow,
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
  PageTitle,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import { formatCurrency, monthLabel } from "@/lib/format";

export default async function ContasPage() {
  const { bundle, source } = await loadBundle();
  const rows = bundle.billMatrix;
  const months =
    rows[0]?.amounts.map((a) => ({ year: a.year, month: a.month })) ??
    defaultMonths(bundle.settings.current_year, bundle.settings.current_month);

  const amountFields = months.map((m) => (
    <Field
      key={`${m.year}-${m.month}`}
      name={`amount_${m.year}_${m.month}`}
      label={monthLabel(m.month, m.year)}
      type="number"
      step="0.01"
      defaultValue={0}
    />
  ));

  const addForm = (
    <CrudForm
      action={upsertBillMatrixRow}
      title="+ Adicionar conta (linha da matriz)"
      submitLabel="Salvar linha"
      defaultOpen={source === "empty" || rows.length === 0}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="account_name" label="Conta" required />
        <Field name="due_day" label="Dia" type="number" min={1} max={31} required defaultValue={1} />
        <Field name="source" label="Fonte" defaultValue="Fixos" placeholder="Fixos / Cartões / Pendências" />
        <Field name="notes" label="Observação" />
        <CheckField name="paid" label="Pago (referência)" />
      </div>
      <p className="text-xs text-ink-muted">Valores por mês (opcional na criação):</p>
      <div className="grid gap-3 sm:grid-cols-3">{amountFields}</div>
    </CrudForm>
  );

  if (source === "empty" || rows.length === 0) {
    return (
      <div className="space-y-6">
        <PageTitle
          eyebrow="Contas"
          title="Contas a pagar (matriz)"
          subtitle="Conta × dia × meses à frente — como Contas_Ago_Jan."
        />
        <EmptyState title="Matriz vazia" text="Importe a planilha ou adicione o primeiro item." />
        {addForm}
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
        subtitle="Adicione/exclua linhas e edite valores mensais. Fonte e observações por conta."
      />

      {addForm}

      <DataTable
        headers={[
          "Conta",
          "Dia",
          ...months.map((m) => monthLabel(m.month, m.year)),
          "Total",
          "Fonte",
          "Ações",
        ]}
      >
        {rows.map((row) => {
          const total = row.amounts.reduce((s, a) => s + a.amount, 0);
          return (
            <tr key={row.id} className="align-top">
              <td className="px-3 py-2.5 font-medium">
                {row.account_name}
                <EditForm action={upsertBillMatrixRow} submitLabel="Salvar linha">
                  <input type="hidden" name="id" value={row.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field name="account_name" label="Conta" required defaultValue={row.account_name} />
                    <Field name="due_day" label="Dia" type="number" required defaultValue={row.due_day} />
                    <Field name="source" label="Fonte" defaultValue={row.source} />
                    <Field name="notes" label="Obs" defaultValue={row.notes ?? ""} />
                    <CheckField name="paid" label="Pago" defaultChecked={row.paid} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {months.map((m) => {
                      const hit = row.amounts.find(
                        (a) => a.month === m.month && a.year === m.year,
                      );
                      return (
                        <Field
                          key={`${row.id}-${m.year}-${m.month}`}
                          name={`amount_${m.year}_${m.month}`}
                          label={monthLabel(m.month, m.year)}
                          type="number"
                          step="0.01"
                          defaultValue={hit?.amount ?? 0}
                        />
                      );
                    })}
                  </div>
                </EditForm>
              </td>
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
              <td className="px-3 py-2.5">
                <DeleteButton
                  action={deleteBillMatrixRow}
                  id={row.id}
                  confirmMessage={`Excluir a conta "${row.account_name}" da matriz?`}
                />
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
          <td colSpan={2} />
        </tr>
      </DataTable>
    </div>
  );
}

function defaultMonths(year: number, month: number) {
  const out: { year: number; month: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(year, month - 1 + i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return out;
}
