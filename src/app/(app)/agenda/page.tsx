import { toggleAgendaPaid } from "@/app/actions";
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
  const irpf = bundle.agenda.filter(
    (a) => a.account_name.toUpperCase().includes("IRPF") && !(a.month === month && a.year === year && !a.account_name.includes("—")),
  );
  const pending = bundle.agenda
    .filter((a) => !a.paid)
    .reduce((s, a) => s + a.amount, 0);

  if (source === "empty" || bundle.agenda.length === 0) {
    return (
      <div>
        <PageTitle
          eyebrow="Agenda"
          title="Agenda financeira"
          subtitle="Calendário de pagamentos do mês — marque Pago = S."
        />
        <EmptyState
          title="Agenda vazia"
          text="Importe a planilha ou cadastre vencimentos para acompanhar o mês."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Agenda"
        title={`Agenda — ${fullMonthLabel(month, year)}`}
        subtitle="Vermelho = atrasado · Amarelo = vence em breve · Verde = pago. Marque pago para atualizar o status."
      />

      <p className="text-sm text-ink-muted">
        Total pendente (jul + IRPF futuros):{" "}
        <strong className="text-ink">{formatCurrency(pending)}</strong>
      </p>

      <DataTable
        headers={["Dia", "Conta", "Valor", "Pago", "Status", "Categoria", ""]}
      >
        {items.map((item) => {
          const st = agendaStatus(item, bundle.settings.reference_day);
          return (
            <tr key={item.id} className="align-middle">
              <td className="px-3 py-2.5 font-medium">{item.due_day}</td>
              <td className="px-3 py-2.5">{item.account_name}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(item.amount)}
              </td>
              <td className="px-3 py-2.5">{item.paid ? "S" : "N"}</td>
              <td className="px-3 py-2.5">
                <StatusPill label={st} tone={statusTone(st)} />
              </td>
              <td className="px-3 py-2.5 text-ink-muted">{item.category}</td>
              <td className="px-3 py-2.5">
                <form action={toggleAgendaPaid}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="paid" value={String(item.paid)} />
                  <button
                    type="submit"
                    className="text-sm font-medium text-accent-deep underline-offset-2 hover:underline"
                  >
                    {item.paid ? "Desmarcar" : "Marcar pago"}
                  </button>
                </form>
              </td>
            </tr>
          );
        })}
      </DataTable>

      {irpf.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
            IRPF — parcelas futuras
          </h2>
          <DataTable headers={["Dia", "Conta", "Valor", "Pago", "Status"]}>
            {irpf.map((item) => {
              const st = agendaStatus(item, bundle.settings.reference_day);
              return (
                <tr key={item.id}>
                  <td className="px-3 py-2.5">{item.due_day}</td>
                  <td className="px-3 py-2.5">{item.account_name}</td>
                  <td className="px-3 py-2.5">{formatCurrency(item.amount)}</td>
                  <td className="px-3 py-2.5">{item.paid ? "S" : "N"}</td>
                  <td className="px-3 py-2.5">
                    <StatusPill label={st} tone={statusTone(st)} />
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
