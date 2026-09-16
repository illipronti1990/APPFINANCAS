import { formatCurrency } from "@/lib/format";

type Summary = {
  gasto: number;
  evitado: number;
  monthLabel: string;
};

export function DashboardSummary({ gasto, evitado, monthLabel }: Summary) {
  const saldoConsciencia = evitado - gasto;

  return (
    <section className="reveal grid gap-4 sm:grid-cols-3">
      <Stat
        label="Gastos do mês"
        value={formatCurrency(gasto)}
        tone="gasto"
      />
      <Stat
        label="Deixei de gastar"
        value={formatCurrency(evitado)}
        tone="evitei"
      />
      <Stat
        label="Diferença no mês"
        value={formatCurrency(saldoConsciencia)}
        hint={monthLabel}
        tone={saldoConsciencia >= 0 ? "evitei" : "gasto"}
      />
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "gasto" | "evitei";
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface/90 p-5 shadow-sm">
      <p className="text-sm text-ink-muted">{label}</p>
      <p
        className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold ${
          tone === "evitei" ? "text-accent-deep" : "text-ink"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function CategoryBars({
  title,
  items,
  total,
}: {
  title: string;
  items: { category: string; total: number }[];
  total: number;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
          {title}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Sem dados neste mês ainda. Seus lançamentos aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface/90 p-5 shadow-sm">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
        {title}
      </h2>
      <ul className="mt-4 space-y-4">
        {items.map((item, index) => {
          const pct = total > 0 ? Math.round((item.total / total) * 100) : 0;
          return (
            <li key={item.category} className="reveal" style={{ animationDelay: `${index * 60}ms` }}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink">{item.category}</span>
                <span className="text-sm text-ink-muted">
                  {formatCurrency(item.total)} · {pct}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-bg-soft">
                <div
                  className="bar-fill h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(pct, 4)}%`, animationDelay: `${index * 80}ms` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TrendList({
  months,
}: {
  months: { key: string; label: string; gasto: number; evitado: number }[];
}) {
  if (months.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-line bg-surface/90 p-5 shadow-sm">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
        Tendência (últimos meses)
      </h2>
      <ul className="mt-4 divide-y divide-line/70">
        {months.map((month) => (
          <li
            key={month.key}
            className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
          >
            <span className="font-medium text-ink">{month.label}</span>
            <span className="text-ink-muted">
              Gastos {formatCurrency(month.gasto)} · Evitei{" "}
              {formatCurrency(month.evitado)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
