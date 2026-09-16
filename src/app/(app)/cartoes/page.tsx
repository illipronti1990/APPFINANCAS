import { updateCardUsed } from "@/app/actions";
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

  if (source === "empty" || cards.length === 0) {
    return (
      <div>
        <PageTitle
          eyebrow="Cartões"
          title="Cartões de crédito"
          subtitle="Limite × utilizado × disponível × status + cronograma."
        />
        <EmptyState title="Sem cartões" text="Importe a planilha para carregar limites e faturas." />
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
        subtitle="🟢 ≤30% · 🟡 31–50% · 🟠 51–80% · 🔴 >80%. Atualize o utilizado pelo app do banco."
      />

      <section className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Limite total" value={formatCurrency(limite)} />
        <Kpi label="Utilizado" value={formatCurrency(usado)} tone="warn" />
        <Kpi
          label="Disponível"
          value={formatCurrency(disp)}
          tone={disp < 0 ? "danger" : "ok"}
        />
        <Kpi label="Faturas Ago" value={formatCurrency(ago)} />
      </section>

      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
          Dash de uso
        </h2>
        <ul className="space-y-3">
          {cards.map((c) => {
            const pct =
              c.limit_total > 0 ? (c.used_amount / c.limit_total) * 100 : 0;
            const tone = cardUsageTone(pct);
            return (
              <li
                key={c.id}
                className="rounded-2xl border border-line bg-surface/90 p-4"
              >
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
                  <span>
                    Disp. {formatCurrency(c.limit_total - c.used_amount)}
                  </span>
                  <span>{formatPercent(pct, 0)}</span>
                </div>
                <form action={updateCardUsed} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <label className="text-xs text-ink-muted">
                    Atualizar utilizado
                    <input
                      name="used"
                      type="number"
                      step="0.01"
                      defaultValue={c.used_amount}
                      className="mt-1 block w-36 rounded-lg border border-line px-2 py-1.5 text-sm text-ink"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-deep"
                  >
                    Salvar
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
          Detalhe dos cartões
        </h2>
        <DataTable
          headers={[
            "Banco",
            "Cartão",
            "Limite",
            "Utilizado",
            "Disponível",
            "%",
            "Fecha",
            "Vence",
            "Fatura",
            "Próx.",
            "Status",
          ]}
        >
          {cards.map((c) => {
            const pct =
              c.limit_total > 0 ? (c.used_amount / c.limit_total) * 100 : 0;
            return (
              <tr key={c.id}>
                <td className="px-3 py-2.5">{c.bank}</td>
                <td className="px-3 py-2.5 font-medium">{c.card_name}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatCurrency(c.limit_total)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatCurrency(c.used_amount)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatCurrency(c.limit_total - c.used_amount)}
                </td>
                <td className="px-3 py-2.5">{formatPercent(pct, 0)}</td>
                <td className="px-3 py-2.5">{c.close_day ?? "—"}</td>
                <td className="px-3 py-2.5">{c.due_day ?? "—"}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatCurrency(c.current_bill)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatCurrency(c.next_bill)}
                </td>
                <td className="px-3 py-2.5">
                  <StatusPill
                    label={cardUsageStatus(pct)}
                    tone={cardUsageTone(pct)}
                  />
                </td>
              </tr>
            );
          })}
        </DataTable>
      </div>

      {months.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
            Cronograma de parcelas
          </h2>
          <DataTable
            headers={[
              "Cartão",
              ...months.map((m) => monthLabel(m.month, m.year)),
              "Total",
            ]}
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
                      <td
                        key={`${c.id}-${m.year}-${m.month}`}
                        className="px-3 py-2.5 whitespace-nowrap"
                      >
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
