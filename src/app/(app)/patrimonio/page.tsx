import {
  DataTable,
  EmptyState,
  Kpi,
  PageTitle,
} from "@/components/controladoria/ui";
import { loadBundle } from "@/lib/data/bundle";
import { formatCurrency } from "@/lib/format";

export default async function PatrimonioPage() {
  const { bundle, source } = await loadBundle();
  const assets = bundle.assets;
  const liab = bundle.liabilities.filter((l) => !l.is_consignado);
  const consignado = bundle.liabilities.filter((l) => l.is_consignado);
  const ativos = assets.reduce((s, a) => s + a.value, 0);
  const passivos = liab.reduce((s, l) => s + l.balance, 0);
  const consTotal = consignado.reduce((s, l) => s + l.balance, 0);
  const pl = ativos - passivos;
  const plCom = pl - consTotal;

  if (source === "empty" || (assets.length === 0 && liab.length === 0)) {
    return (
      <div>
        <PageTitle
          eyebrow="Patrimônio"
          title="Controle patrimonial"
          subtitle="Ativos − passivos (com/sem consignado) + meta casa própria."
        />
        <EmptyState title="Patrimônio vazio" text="Importe a planilha para carregar ativos e passivos." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow="Patrimônio"
        title="Controle patrimonial"
        subtitle="Atualize ativos e passivos. PL = Ativos − Passivos (s/ consignado)."
      />

      <section className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Ativos" value={formatCurrency(ativos)} tone="ok" />
        <Kpi label="Passivos (s/ cons.)" value={formatCurrency(passivos)} tone="danger" />
        <Kpi label="PL (s/ consignado)" value={formatCurrency(pl)} tone="accent" />
        <Kpi label="PL (c/ consignado)" value={formatCurrency(plCom)} />
      </section>

      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
          Ativos
        </h2>
        <DataTable headers={["Ativo", "Valor", "Tipo", "Obs"]}>
          {assets.map((a) => (
            <tr key={a.id}>
              <td className="px-3 py-2.5 font-medium">{a.name}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(a.value)}
              </td>
              <td className="px-3 py-2.5">{a.asset_type}</td>
              <td className="max-w-[16rem] truncate px-3 py-2.5 text-xs text-ink-muted">
                {a.notes}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
          Passivos (sem consignado)
        </h2>
        <DataTable headers={["Dívida", "Saldo", "Fonte", "Obs"]}>
          {liab.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2.5 font-medium">{l.name}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatCurrency(l.balance)}
              </td>
              <td className="px-3 py-2.5">{l.source}</td>
              <td className="max-w-[16rem] truncate px-3 py-2.5 text-xs text-ink-muted">
                {l.notes}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {bundle.netWorthGoal ? (
        <div className="rounded-2xl border border-line bg-surface/90 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
            Meta — casa própria
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-ink-muted">
            <li>
              Valor alvo:{" "}
              <strong className="text-ink">
                {formatCurrency(bundle.netWorthGoal.home_target)}
              </strong>
            </li>
            <li>
              Carta de crédito:{" "}
              <strong className="text-ink">
                {formatCurrency(bundle.netWorthGoal.credit_letter)}
              </strong>
            </li>
            <li>
              Entrada necessária / falta:{" "}
              <strong className="text-ink">
                {formatCurrency(bundle.netWorthGoal.down_payment_needed)} /{" "}
                {formatCurrency(bundle.netWorthGoal.down_payment_missing)}
              </strong>
            </li>
            <li>Prazo: {bundle.netWorthGoal.estimated_deadline ?? "—"}</li>
            {bundle.netWorthGoal.strategy ? (
              <li className="pt-2">{bundle.netWorthGoal.strategy}</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
