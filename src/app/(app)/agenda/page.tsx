import { toggleAgendaPaid } from "@/app/actions";
import {
  deleteAgendaItem,
  upsertAgendaItem,
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
  StatusPill,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import { agendaStatus, statusTone } from "@/lib/domain/compute";
import { formatCurrency, fullMonthLabel } from "@/lib/format";

export default async function AgendaPage() {
  const { bundle, source } = await loadBundle();
  const month = bundle.settings.current_month;
  const year = bundle.settings.current_year;
  const items = bundle.agenda
    .filter((a) => a.month === month && a.year === year)
    .sort((a, b) => a.due_day - b.due_day);
  const pending = bundle.agenda
    .filter((a) => !a.paid)
    .reduce((s, a) => s + a.amount, 0);

  const addForm = (
    <CrudForm
      action={upsertAgendaItem}
      title="+ Adicionar vencimento"
      submitLabel="Salvar na agenda"
      defaultOpen={source === "empty" || items.length === 0}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="due_day" label="Dia" type="number" min={1} max={31} required defaultValue={1} />
        <Field name="amount" label="Valor (R$)" type="number" step="0.01" min={0.01} required />
        <Field name="account_name" label="Conta" required placeholder="Ex.: DAS" />
        <Field name="category" label="Categoria" defaultValue="Geral" />
        <Field name="month" label="Mês" type="number" min={1} max={12} required defaultValue={month} />
        <Field name="year" label="Ano" type="number" required defaultValue={year} />
        <Field name="notes" label="Observação (opcional)" />
        <CheckField name="paid" label="Já pago" />
      </div>
    </CrudForm>
  );

  if (source === "empty" || bundle.agenda.length === 0) {
    return (
      <div className="space-y-6">
        <PageTitle
          eyebrow="Agenda"
          title="Agenda financeira"
          subtitle="Calendário de pagamentos do mês — adicione, edite ou exclua itens."
        />
        <EmptyState
          title="Agenda vazia"
          text="Importe a planilha ou adicione o primeiro item."
        />
        {addForm}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Agenda"
        title={`Agenda — ${fullMonthLabel(month, year)}`}
        subtitle="Adicione, edite ou exclua vencimentos. Vermelho = atrasado · Amarelo = em breve · Verde = pago."
      />

      {addForm}

      <p className="text-sm text-ink-muted">
        Total pendente:{" "}
        <strong className="text-ink">{formatCurrency(pending)}</strong>
      </p>

      <DataTable
        headers={["Dia", "Conta", "Valor", "Pago", "Status", "Categoria", "Ações"]}
      >
        {items.map((item) => {
          const st = agendaStatus(item, bundle.settings.reference_day);
          return (
            <tr key={item.id} className="align-top">
              <td className="px-3 py-2.5 font-medium">{item.due_day}</td>
              <td className="px-3 py-2.5">
                {item.account_name}
                <EditForm action={upsertAgendaItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field name="due_day" label="Dia" type="number" min={1} max={31} required defaultValue={item.due_day} />
                    <Field name="amount" label="Valor" type="number" step="0.01" required defaultValue={item.amount} />
                    <Field name="account_name" label="Conta" required defaultValue={item.account_name} />
                    <Field name="category" label="Categoria" defaultValue={item.category} />
                    <Field name="month" label="Mês" type="number" required defaultValue={item.month} />
                    <Field name="year" label="Ano" type="number" required defaultValue={item.year} />
                    <Field name="notes" label="Obs" defaultValue={item.notes ?? ""} />
                    <CheckField name="paid" label="Pago" defaultChecked={item.paid} />
                  </div>
                </EditForm>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(item.amount)}
              </td>
              <td className="px-3 py-2.5">{item.paid ? "S" : "N"}</td>
              <td className="px-3 py-2.5">
                <StatusPill label={st} tone={statusTone(st)} />
              </td>
              <td className="px-3 py-2.5 text-ink-muted">{item.category}</td>
              <td className="space-y-2 px-3 py-2.5">
                <form action={toggleAgendaPaid}>
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
                  action={deleteAgendaItem}
                  id={item.id}
                  confirmMessage={`Excluir "${item.account_name}" da agenda?`}
                />
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
