import { ScenarioForm } from "@/components/controladoria/ScenarioForm";
import {
  DataTable,
  EmptyState,
  Kpi,
  PageTitle,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import { runSimulator } from "@/lib/domain/compute";
import { formatCurrency } from "@/lib/format";

export default async function SimuladorPage() {
  const { bundle, source } = await loadBundle();

  if (source === "empty" || bundle.debtCandidates.length === 0) {
    return (
      <div>
        <PageTitle
          eyebrow="Simulador"
          title="Simulador inteligente"
          subtitle="Digite quanto recebeu → recomendação automática."
        />
        <EmptyState title="Sem dados" text="Importe a planilha para ativar o simulador." />
      </div>
    );
  }

  const result = runSimulator(
    bundle.scenario.simulator_received,
    bundle.debtCandidates,
  );

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow="Simulador"
        title="Simulador inteligente"
        subtitle="1) Zerar atraso Caixa PJ (risco) · 2) Mercado Pago se couber (ROI) · 3) Senão amortizar risco."
      />

      <ScenarioForm initial={bundle.scenario} mode="simulator" />

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi
          label="Recebi"
          value={formatCurrency(result.received)}
          tone="accent"
        />
        <Kpi
          label="Quite"
          value={result.recommendation?.displayName ?? "—"}
          tone="warn"
        />
        <Kpi
          label="Economia / sobra"
          value={formatCurrency(
            result.recommendation?.economy ||
              result.recommendation?.leftover ||
              0,
          )}
          hint={
            result.recommendation
              ? `Juros evitados ~${formatCurrency(result.recommendation.interestSaved)}/mês`
              : undefined
          }
          tone="ok"
        />
      </section>

      <DataTable
        headers={["Opção", "Custo", "Cancela", "Economia", "Cabe?", "Sobra"]}
      >
        {result.comparisons.map((c) => (
          <tr key={c.id}>
            <td className="px-3 py-2.5 font-medium">{c.name}</td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(c.cost_to_act)}
            </td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(c.cancels_amount)}
            </td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(c.economy)}
            </td>
            <td className="px-3 py-2.5">{c.fits ? "SIM" : "NÃO"}</td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              {formatCurrency(c.leftover)}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
