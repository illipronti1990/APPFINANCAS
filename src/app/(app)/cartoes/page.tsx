import {
  deleteCreditCard,
  upsertCreditCard,
} from "@/app/actions/crud";
import {
  CrudForm,
  DeleteButton,
  EditForm,
  Field,
} from "@/components/controladoria/CrudControls";
import {
  Bar,
  DataTable,
  EmptyState,
  Kpi,
  PageTitle,
  StatusPill,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import { cardUsageStatus, cardUsageTone } from "@/lib/domain/compute";
import { formatCurrency, formatPercent, monthLabel } from "@/lib/format";

export default async function CartoesPage() {
  const { bundle, source } = await loadBundle();
  const cards = bundle.cards;

  const addForm = (
    <CrudForm
      action={upsertCreditCard}
      title="+ Adicionar cartão"
      submitLabel="Salvar cartão"
      defaultOpen={source === "empty" || cards.length === 0}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="bank" label="Banco" required />
        <Field name="card_name" label="Cartão" required />
        <Field name="limit_total" label="Limite total" type="number" step="0.01" required />
        <Field name="used_amount" label="Utilizado" type="number" step="0.01" defaultValue={0} />
        <Field name="current_bill" label="Fatura atual" type="number" step="0.01" defaultValue={0} />
        <Field name="next_bill" label="Próxima fatura" type="number" step="0.01" defaultValue={0} />
        <Field name="remaining_installments" label="Parcelas restantes" type="number" step="0.01" defaultValue={0} />
        <Field name="close_day" label="Dia fechamento" type="number" min={1} max={31} />
        <Field name="due_day" label="Dia vencimento" type="number" min={1} max={31} />
      </div>
    </CrudForm>
  );

  if (source === "empty" || cards.length === 0) {
    return (
      <div className="space-y-6">
        <PageTitle
          eyebrow="Cartões"
          title="Cartões de crédito"
          subtitle="Limite × utilizado × disponível × status."
        />
        <EmptyState title="Sem cartões" text="Importe a planilha ou adicione o primeiro item." />
        {addForm}
      </div>
    );
  }

  const limite = cards.reduce((s, c) => s + c.limit_total, 0);
  const usado = cards.reduce((s, c) => s + c.used_amount, 0);
  const disp = limite - usado;
  const ago = cards.reduce((s, c) => {
    const hit = c.schedule.find((x) => x.month === 8 && x.year === 2026);
    return s + (hit?.amount ?? 0);
  }, 0);
  const months =
    cards.find((c) => c.schedule.length)?.schedule.map((s) => ({
      month: s.month,
      year: s.year,
    })) ?? [];

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow="Cartões"
        title="Limite total × utilizado × disponível"
        subtitle="Adicione, edite ou exclua cartões. Atualize limite, utilizado e faturas."
      />

      {addForm}

      <section className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Limite total" value={formatCurrency(limite)} />
        <Kpi label="Utilizado" value={formatCurrency(usado)} tone="warn" />
        <Kpi label="Disponível" value={formatCurrency(disp)} tone={disp < 0 ? "danger" : "ok"} />
        <Kpi label="Faturas Ago" value={formatCurrency(ago)} />
      </section>

      <ul className="space-y-3">
        {cards.map((c) => {
          const pct = c.limit_total > 0 ? (c.used_amount / c.limit_total) * 100 : 0;
          const tone = cardUsageTone(pct);
          return (
            <li key={c.id} className="rounded-2xl border border-line bg-surface/90 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{c.card_name}</p>
                  <p className="text-xs text-ink-muted">{c.bank}</p>
                </div>
                <StatusPill label={cardUsageStatus(pct)} tone={tone} />
              </div>
              <Bar pct={Math.min(pct, 100)} tone={tone} />
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-muted">
                <span>Limite {formatCurrency(c.limit_total)}</span>
                <span>Usado {formatCurrency(c.used_amount)}</span>
                <span>Disp. {formatCurrency(c.limit_total - c.used_amount)}</span>
                <span>{formatPercent(pct, 0)}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <EditForm action={upsertCreditCard} submitLabel="Salvar cartão">
                  <input type="hidden" name="id" value={c.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field name="bank" label="Banco" required defaultValue={c.bank} />
                    <Field name="card_name" label="Cartão" required defaultValue={c.card_name} />
                    <Field name="limit_total" label="Limite" type="number" step="0.01" required defaultValue={c.limit_total} />
                    <Field name="used_amount" label="Utilizado" type="number" step="0.01" defaultValue={c.used_amount} />
                    <Field name="current_bill" label="Fatura atual" type="number" step="0.01" defaultValue={c.current_bill} />
                    <Field name="next_bill" label="Próxima fatura" type="number" step="0.01" defaultValue={c.next_bill} />
                    <Field name="remaining_installments" label="Parcelas rest." type="number" step="0.01" defaultValue={c.remaining_installments} />
                    <Field name="close_day" label="Fecha" type="number" defaultValue={c.close_day ?? ""} />
                    <Field name="due_day" label="Vence" type="number" defaultValue={c.due_day ?? ""} />
                  </div>
                </EditForm>
                <DeleteButton
                  action={deleteCreditCard}
                  id={c.id}
                  confirmMessage={`Excluir o cartão "${c.card_name}"?`}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {months.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
            Cronograma de parcelas
          </h2>
          <DataTable
            headers={["Cartão", ...months.map((m) => monthLabel(m.month, m.year)), "Total"]}
          >
            {cards.map((c) => {
              const total = c.schedule.reduce((s, x) => s + x.amount, 0);
              return (
                <tr key={`sch-${c.id}`}>
                  <td className="px-3 py-2.5 font-medium">{c.card_name}</td>
                  {months.map((m) => {
                    const hit = c.schedule.find(
                      (x) => x.month === m.month && x.year === m.year,
                    );
                    return (
                      <td key={`${c.id}-${m.year}-${m.month}`} className="px-3 py-2.5 whitespace-nowrap">
                        {formatCurrency(hit?.amount ?? 0)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 whitespace-nowrap font-semibold">
                    {formatCurrency(total)}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </div>
      ) : null}
    </div>
  );
}
