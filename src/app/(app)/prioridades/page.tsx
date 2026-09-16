import {
  DataTable,
  EmptyState,
  Kpi,
  PageTitle,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import { nextPriority } from "@/lib/domain/compute";
import { formatCurrency } from "@/lib/format";

export default async function PrioridadesPage() {
  const { bundle, source } = await loadBundle();
  const items = bundle.priorities;
  const next = nextPriority(items);

  if (source === "empty" || items.length === 0) {
    return (
      <div>
        <PageTitle
          eyebrow="Prioridades"
          title="Plano de ataque"
          subtitle="Ordem de prioridade — a primeira linha aberta alimenta o Início/Dashboard."
        />
        <EmptyState title="Sem prioridades" text="Importe a planilha para montar o plano de ataque." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Prioridades"
        title="Plano de ataque"
        subtitle="A primeira com status diferente de Feito/Em dia é a próxima prioridade."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Próxima prioridade" value={next?.debt_name ?? "—"} tone="warn" />
        <Kpi label="Ação sugerida" value={next?.action ?? "—"} />
        <Kpi
          label="Caixa livre"
          value={formatCurrency(bundle.settings.caixa_livre)}
          tone="ok"
        />
      </section>

      <DataTable headers={["#", "Dívida", "Ação", "Valor", "Status", "Motivo"]}>
        {items
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((p) => (
            <tr key={p.id}>
              <td className="px-3 py-2.5">{p.sort_order === 99 ? "✓" : p.sort_order}</td>
              <td className="px-3 py-2.5 font-medium">{p.debt_name}</td>
              <td className="px-3 py-2.5">{p.action}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {p.amount != null ? formatCurrency(p.amount) : "—"}
              </td>
              <td className="px-3 py-2.5">{p.status}</td>
              <td className="max-w-[18rem] px-3 py-2.5 text-xs text-ink-muted">
                {p.reason}
              </td>
            </tr>
          ))}
      </DataTable>

      <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-ink-muted">
        Ranking (juros × ROI) e histórico de uso do caixa livre seguem o modelo da
        planilha; edite prioridades aqui após importar. Próxima evolução: CRUD
        completo do ranking na nuvem.
      </div>
    </div>
  );
}
