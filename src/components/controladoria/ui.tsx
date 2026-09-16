import { formatCurrency } from "@/lib/format";

export function PageTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="reveal mb-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent-deep">
        {eyebrow}
      </p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
        {title}
      </h1>
      {subtitle ? <p className="mt-2 max-w-2xl text-ink-muted">{subtitle}</p> : null}
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "ok" | "warn" | "danger" | "accent";
}) {
  const color =
    tone === "ok"
      ? "text-accent-deep"
      : tone === "warn"
        ? "text-[color:var(--color-warn)]"
        : tone === "danger"
          ? "text-danger"
          : tone === "accent"
            ? "text-accent-deep"
            : "text-ink";
  return (
    <div className="rounded-2xl border border-line bg-surface/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p
        className={`mt-2 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl ${color}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Money({ value }: { value: number }) {
  return <>{formatCurrency(value)}</>;
}

export function EmptyState({
  title,
  text = "Importe a planilha ou adicione o primeiro item.",
  href = "/importar",
  cta = "Importar planilha",
  secondaryCta,
}: {
  title: string;
  text?: string;
  href?: string;
  cta?: string;
  secondaryCta?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/70 px-5 py-10 text-center">
      <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
        {title}
      </p>
      <p className="mt-2 text-ink-muted">{text}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <a
          href={href}
          className="inline-flex rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-accent-deep"
        >
          {cta}
        </a>
        {secondaryCta}
      </div>
    </div>
  );
}

export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: string;
}) {
  const cls =
    tone === "ok"
      ? "bg-accent-soft text-accent-deep"
      : tone === "warn" || tone === "high"
        ? "bg-[#f5edd8] text-[color:var(--color-warn)]"
        : tone === "danger"
          ? "bg-danger-soft text-danger"
          : "bg-bg-soft text-ink-muted";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export function Bar({
  pct,
  tone = "accent",
}: {
  pct: number;
  tone?: "accent" | "ok" | "warn" | "high" | "danger";
}) {
  const width = Math.min(100, Math.max(0, pct));
  const color =
    tone === "ok"
      ? "bg-accent"
      : tone === "warn"
        ? "bg-[#c4a35a]"
        : tone === "high"
          ? "bg-[#c47a3a]"
          : tone === "danger"
            ? "bg-danger"
            : "bg-accent";
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-bg-soft">
      <div
        className={`bar-fill h-full rounded-full ${color}`}
        style={{ width: `${Math.max(width, 3)}%` }}
      />
    </div>
  );
}

export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface/90 shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-bg-soft/80 text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">{children}</tbody>
      </table>
    </div>
  );
}
