import { loadBundle } from "@/lib/data/bundle";
import {
  computeDashboard,
  incomeCommitmentLabel,
  incomeCommitmentTone,
} from "@/lib/domain/compute";
import { formatCurrency, formatPercent, fullMonthLabel } from "@/lib/format";
import {
  Bar,
  EmptyState,
  Kpi,
  PageTitle,
  StatusPill,
} from "@/components/controladoria/ui";

export default async function DashboardPage() {
  const { bundle, source } = await loadBundle();
  const dash = computeDashboard(bundle);
  const empty =
    source === "empty" ||
    (bundle.agenda.length === 0 && bundle.projections.length === 0);

  const tone = incomeCommitmentTone(dash.commitmentPct);

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow="Dashboard"
        title="Dashboard Executivo"
        subtitle={`Controladoria Pessoal · ${fullMonthLabel(bundle.settings.current_month, bundle.settings.current_year)} · estilo Power BI`}
      />

      {empty ? (
        <EmptyState
          title="Sem dados para o painel"
          text="Importe a planilha ou cadastre projeções e fluxo para ver KPIs, velocímetro e alertas."
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Kpi
              label="Receita"
              value={formatCurrency(dash.income)}
              hint="Recorrente / mês de referência"
              tone="ok"
            />
            <Kpi
              label="Despesas (fluxo)"
              value={formatCurrency(dash.expenses)}
              hint="Saídas do mês"
            />
            <Kpi
              label="Sobra / déficit"
              value={formatCurrency(dash.surplus)}
              hint="Receita − despesas do fluxo"
              tone={dash.surplus >= 0 ? "ok" : "danger"}
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <Kpi
              label="Dívidas totais"
              value={formatCurrency(dash.debts)}
              hint="Sem consignado"
              tone="danger"
            />
            <Kpi
              label="Caixa livre"
              value={formatCurrency(dash.caixaLivre)}
              hint="Maquininha restante"
              tone="accent"
            />
            <Kpi
              label="Cartões (Ago)"
              value={formatCurrency(dash.cardsMonth)}
              hint="Faturas do mês seguinte"
            />
          </section>

          <section className="rounded-2xl border border-line bg-surface/90 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                  % renda comprometida
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold">
                  {formatPercent(dash.commitmentPct)}
                </p>
              </div>
              <StatusPill label={incomeCommitmentLabel(dash.commitmentPct)} tone={tone} />
            </div>
            <div className="mt-4">
              <Bar pct={dash.commitmentPct} tone={tone} />
              <p className="mt-2 text-xs text-ink-muted">
                Velocímetro: 0–50% saudável · 50–70% atenção · 70%+ crítico
              </p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface/90 p-5">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
                Dias para sair das dívidas
              </h2>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold">
                {dash.daysLeft}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                Superávit médio {formatCurrency(bundle.settings.monthly_surplus)} ·{" "}
                {dash.monthsLeft} meses · passivos {formatCurrency(dash.debts)}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface/90 p-5">
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
                Alertas
              </h2>
              <ul className="space-y-2">
                {dash.alerts.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border border-line bg-bg-soft/50 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-accent-deep">{a.title}</span>
                    <span className="text-ink-muted"> — {a.message}</span>
                  </li>
                ))}
                {dash.alerts.length === 0 ? (
                  <li className="text-sm text-ink-muted">Nenhum alerta no momento.</li>
                ) : null}
              </ul>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <SeriesCard title="Evolução da dívida" series={dash.debtSeries} />
            <SeriesCard title="Evolução do PL" series={dash.plSeries} />
          </section>
        </>
      )}
    </div>
  );
}

function SeriesCard({
  title,
  series,
}: {
  title: string;
  series: { label: string; value: number }[];
}) {
  const max = Math.max(...series.map((s) => Math.abs(s.value)), 1);
  return (
    <div className="rounded-2xl border border-line bg-surface/90 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
        {title}
      </h2>
      <ul className="mt-4 space-y-2">
        {series.slice(0, 8).map((s) => (
          <li key={s.label} className="text-sm">
            <div className="mb-1 flex justify-between gap-2">
              <span className="text-ink-muted">{s.label}</span>
              <span className="font-medium">{formatCurrency(s.value)}</span>
            </div>
            <Bar pct={(Math.abs(s.value) / max) * 100} />
          </li>
        ))}
      </ul>
    </div>
  );
}
