import { ScenarioForm } from "@/components/controladoria/ScenarioForm";
import {
  DataTable,
  EmptyState,
  Kpi,
  PageTitle,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import { runScenarioPlan, totalDebts } from "@/lib/domain/compute";
import { formatCurrency } from "@/lib/format";

export default async function CenariosPage() {
  const { bundle, source } = await loadBundle();

  if (source === "empty" || bundle.debtCandidates.length === 0) {
    return (
      <div>
        <PageTitle
          eyebrow="Cenários"
          title="Cenários financeiros"
          subtitle="Extra, bônus, venda — decide o que quitar (risco → ROI)."
        />
        <EmptyState
          title="Sem candidatos de dívida"
          text="Importe a planilha para montar o plano automático e juros evitados."
        />
      </div>
    );
  }

  const plan = runScenarioPlan(
    bundle.scenario,
    bundle.debtCandidates,
    totalDebts(bundle),
  );

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow="Cenários"
        title="Simule e decida"
        subtitle="Preencha o que entra. O app monta o melhor uso (Caixa PJ primeiro por risco, depois ROI)."
      />

      <ScenarioForm initial={bundle.scenario} mode="scenario" />

      <section className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Total disponível" value={formatCurrency(plan.total)} tone="accent" />
        <Kpi
          label="Juros evitados / mês"
          value={formatCurrency(plan.interestSaved)}
          tone="ok"
          hint="“Deixei de gastar” em juros"
        />
        <Kpi
          label="Antecipa saída"
          value={`${plan.daysGained} dias`}
          hint={`${plan.monthsAfter} meses restantes`}
        />
        <Kpi label="Quite primeiro" value={plan.quitePrimeiro} tone="warn" />
      </section>

      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
          Plano automático
        </h2>
        <DataTable headers={["Passo", "Ação", "Valor aplicado", "Sobra", "Efeito"]}>
          {plan.steps.map((s, i) => (
            <tr key={i}>
              <td className="px-3 py-2.5">{i + 1}</td>
              <td className="px-3 py-2.5">{s.action}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(s.applied)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(s.leftover)}
              </td>
              <td className="px-3 py-2.5 text-sm text-ink-muted">{s.effect}</td>
            </tr>
          ))}
        </DataTable>
      </div>

      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
          Dívidas candidatas
        </h2>
        <DataTable
          headers={[
            "Dívida",
            "Custo p/ agir",
            "Cancela",
            "Economia",
            "Juros % a.m.",
            "Juros R$/mês",
          ]}
        >
          {bundle.debtCandidates.map((c) => (
            <tr key={c.id}>
              <td className="px-3 py-2.5 font-medium">
                {c.name}
                {c.is_risk_first ? " · risco" : ""}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(c.cost_to_act)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(c.cancels_amount)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(Math.max(0, c.cancels_amount - c.cost_to_act))}
              </td>
              <td className="px-3 py-2.5">
                {c.interest_rate_month.toFixed(1).replace(".", ",")}%
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(
                  c.cancels_amount * (c.interest_rate_month / 100),
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <div className="rounded-2xl border border-line bg-accent-soft/40 p-5 text-sm text-ink">
        <p className="font-semibold text-accent-deep">Veredito</p>
        <p className="mt-2">
          Com {formatCurrency(plan.total)} disponíveis: {plan.quitePrimeiro}. Você
          deixa de pagar ~{formatCurrency(plan.interestSaved)}/mês em juros
          (economia tipo “deixei de gastar”). Saída do vermelho antecipada em{" "}
          {plan.daysGained} dias ({plan.monthsAfter} meses restantes).
        </p>
      </div>
    </div>
  );
}
