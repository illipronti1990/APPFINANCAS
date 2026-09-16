import {
  deleteCashflowDay,
  regenerateCashflowFromAgenda,
  updateCashflowOpening,
  upsertCashflowDay,
} from "@/app/actions/crud";
import {
  ActionFeedback,
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
  StatusPill,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import { buildCashflowRows } from "@/lib/domain/compute";
import { formatCurrency, fullMonthLabel } from "@/lib/format";

export default async function FluxoPage() {
  const { bundle, source } = await loadBundle();
  const year = bundle.settings.current_year;
  const month = bundle.settings.current_month;
  const cf = bundle.cashflow ?? {
    year,
    month,
    opening_balance: 0,
    caixa_livre: bundle.settings.caixa_livre,
    days: [],
  };

  const income = cf.days.reduce((s, d) => s + d.inflows, 0);
  const expenses = cf.days.reduce((s, d) => s + d.outflows, 0);
  const surplus = income - expenses;
  const rows = buildCashflowRows(cf.opening_balance, cf.days, surplus);
  const empty = source === "empty" || cf.days.length === 0;

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Fluxo diário"
        title={`Caixa — ${fullMonthLabel(cf.month, cf.year)}`}
        subtitle="Edite saldo inicial, lance dias (entradas/saídas/eventos) ou regenere saídas a partir da Agenda."
      />

      <div className="rounded-2xl border border-line bg-accent-soft/30 p-4 text-sm text-ink">
        <p className="font-semibold text-accent-deep">Como usar o Fluxo</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-muted">
          <li>Defina o <strong className="text-ink">saldo inicial</strong> do mês.</li>
          <li>
            Lance <strong className="text-ink">entradas</strong> (salário, adiantamento) nos dias
            correspondentes.
          </li>
          <li>
            Use <strong className="text-ink">Regenerar saídas da Agenda</strong> para espelhar
            vencimentos, ou edite dias manualmente.
          </li>
          <li>Linhas com saldo final negativo mostram alerta <strong>SEM CAIXA</strong>.</li>
        </ol>
      </div>

      <ActionFeedback
        action={updateCashflowOpening}
        className="grid gap-3 rounded-2xl border border-line bg-surface/90 p-4 sm:grid-cols-4"
      >
        <input type="hidden" name="year" value={cf.year} />
        <input type="hidden" name="month" value={cf.month} />
        <Field
          name="opening_balance"
          label="Saldo inicial"
          type="number"
          step="0.01"
          defaultValue={cf.opening_balance}
        />
        <Field
          name="caixa_livre"
          label="Caixa livre"
          type="number"
          step="0.01"
          defaultValue={cf.caixa_livre}
        />
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep"
          >
            Salvar saldo
          </button>
        </div>
      </ActionFeedback>

      <ActionFeedback action={regenerateCashflowFromAgenda} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="year" value={cf.year} />
        <input type="hidden" name="month" value={cf.month} />
        <button
          type="submit"
          className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-accent-deep hover:bg-accent-soft"
        >
          Regenerar saídas a partir da Agenda
        </button>
        <span className="text-xs text-ink-muted">
          Mantém entradas existentes; reaplica saídas pelos vencimentos do mês.
        </span>
      </ActionFeedback>

      <CrudForm
        action={upsertCashflowDay}
        title="+ Adicionar / atualizar dia"
        submitLabel="Salvar dia"
        defaultOpen={empty}
      >
        <input type="hidden" name="year" value={cf.year} />
        <input type="hidden" name="month" value={cf.month} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="day" label="Dia" type="number" min={1} max={31} required />
          <Field name="inflows" label="Entradas" type="number" step="0.01" defaultValue={0} />
          <Field name="outflows" label="Saídas" type="number" step="0.01" defaultValue={0} />
          <Field name="events" label="Eventos" placeholder="+ Salário | ✓ Conta X" />
        </div>
      </CrudForm>

      {empty ? (
        <EmptyState
          title="Fluxo sem dias"
          text="Importe a planilha ou adicione o primeiro item (ou regenere a partir da Agenda)."
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-4">
            <Kpi label="Saldo inicial" value={formatCurrency(cf.opening_balance)} />
            <Kpi label="Entradas" value={formatCurrency(income)} tone="ok" />
            <Kpi label="Saídas" value={formatCurrency(expenses)} />
            <Kpi
              label="Saldo fim do mês"
              value={formatCurrency(rows.at(-1)?.closing ?? 0)}
              tone={(rows.at(-1)?.closing ?? 0) >= 0 ? "ok" : "danger"}
            />
          </section>

          <DataTable
            headers={[
              "Dia",
              "Saldo inicial",
              "Entradas",
              "Saídas",
              "Saldo final",
              "Eventos",
              "Alerta",
              "Ações",
            ]}
          >
            {rows.map((r) => (
              <tr key={r.id} className={r.alert ? "bg-danger-soft/40 align-top" : "align-top"}>
                <td className="px-3 py-2.5 font-medium">
                  {r.day}
                  <EditForm action={upsertCashflowDay}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="year" value={cf.year} />
                    <input type="hidden" name="month" value={cf.month} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field name="day" label="Dia" type="number" required defaultValue={r.day} />
                      <Field name="inflows" label="Entradas" type="number" step="0.01" defaultValue={r.inflows} />
                      <Field name="outflows" label="Saídas" type="number" step="0.01" defaultValue={r.outflows} />
                      <Field name="events" label="Eventos" defaultValue={r.events ?? ""} />
                    </div>
                  </EditForm>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(r.opening)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(r.inflows)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(r.outflows)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap font-medium">
                  {formatCurrency(r.closing)}
                </td>
                <td className="max-w-[14rem] truncate px-3 py-2.5 text-xs text-ink-muted">
                  {r.events || "—"}
                </td>
                <td className="px-3 py-2.5">
                  {r.alert ? <StatusPill label={r.alert} tone="danger" /> : null}
                </td>
                <td className="px-3 py-2.5">
                  <DeleteButton
                    action={deleteCashflowDay}
                    id={r.id}
                    confirmMessage={`Excluir o dia ${r.day} do fluxo?`}
                  />
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
    </div>
  );
}
