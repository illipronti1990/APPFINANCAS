import Link from "next/link";
import { loadBundle } from "@/lib/data/bundle";
import {
  agendaStatus,
  computeDashboard,
  statusTone,
} from "@/lib/domain/compute";
import {
  formatCurrency,
  fullMonthLabel,
  greetingForNow,
  weekdayLabel,
} from "@/lib/format";
import {
  EmptyState,
  Kpi,
  PageTitle,
  StatusPill,
} from "@/components/controladoria/ui";
import { NAV } from "@/components/AppHeader";

export default async function InicioPage() {
  const { bundle, source } = await loadBundle();
  const dash = computeDashboard(bundle);
  const empty =
    source === "empty" ||
    (bundle.agenda.length === 0 && bundle.cards.length === 0);

  const today = new Date();
  const dateLabel = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow="Início"
        title={`${greetingForNow()}, ${bundle.settings.display_name}`}
        subtitle={`Hoje é ${dateLabel} · ${weekdayLabel()}. Página executiva do dia — ligada ao Fluxo, Agenda e Fixos.`}
      />

      {empty ? (
        <EmptyState
          title="Controladoria pronta para começar"
          text="Importe a planilha Excel para carregar contas, cartões, fluxo e dívidas. Novos meses começam vazios até você lançar ou importar."
        />
      ) : (
        <>
          <section className="reveal grid gap-4 sm:grid-cols-3">
            <Kpi
              label="Hoje vence"
              value={
                dash.hojeVence.length === 0
                  ? "Nada pendente ✓"
                  : `${dash.hojeVence.length} conta(s)`
              }
              hint={
                dash.hojeVence[0]
                  ? `${dash.hojeVence[0].account_name} · ${formatCurrency(dash.hojeVence[0].amount)}`
                  : `Dia de referência: ${bundle.settings.reference_day}`
              }
              tone="ok"
            />
            <Kpi
              label="Saldo (fluxo)"
              value={formatCurrency(dash.fluxoSaldo)}
              hint={fullMonthLabel(
                bundle.settings.current_month,
                bundle.settings.current_year,
              )}
              tone={dash.fluxoSaldo < 0 ? "danger" : "accent"}
            />
            <Kpi
              label="Próximo recebimento"
              value={
                dash.nextRecv
                  ? formatCurrency(dash.nextRecv.amount)
                  : "—"
              }
              hint={
                dash.nextRecv
                  ? `Dia ${dash.nextRecv.day} — ${dash.nextRecv.label}`
                  : "Sem entrada futura no fluxo"
              }
              tone="accent"
            />
          </section>

          <section className="reveal reveal-delay-1 grid gap-4 sm:grid-cols-3">
            <Kpi
              label="Dias p/ sair das dívidas"
              value={String(dash.daysLeft || "—")}
              hint={`${dash.monthsLeft} meses · superávit ${formatCurrency(bundle.settings.monthly_surplus)}`}
            />
            <Kpi
              label="Próxima prioridade"
              value={dash.priority?.debt_name ?? "—"}
              hint={dash.priority?.action}
              tone="warn"
            />
            <Kpi
              label="Caixa livre"
              value={formatCurrency(dash.caixaLivre)}
              hint="Maquininha / disponível imediato"
              tone="ok"
            />
          </section>

          <section className="reveal reveal-delay-2 space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
              Próximos vencimentos (7 dias)
            </h2>
            {dash.next7.length === 0 ? (
              <p className="text-sm text-ink-muted">Nenhum vencimento nesta janela.</p>
            ) : (
              <ul className="space-y-2">
                {dash.next7.map((item) => {
                  const st = agendaStatus(item, bundle.settings.reference_day);
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface/90 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-ink">
                          Dia {item.due_day} · {item.account_name}
                        </p>
                        <p className="text-sm text-ink-muted">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                      <StatusPill label={st} tone={statusTone(st)} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="reveal reveal-delay-3">
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
              Atalhos
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {NAV.filter((n) => n.href !== "/inicio" && n.href !== "/importar")
                .slice(0, 6)
                .map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="rounded-xl border border-line bg-surface/90 px-4 py-3 text-sm font-medium text-accent-deep no-underline transition hover:bg-accent-soft"
                  >
                    {n.label}
                  </Link>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
