import {
  deleteAsset,
  deleteLiability,
  upsertAsset,
  upsertLiability,
} from "@/app/actions/crud";
import {
  CheckField,
  CrudForm,
  DeleteButton,
  EditForm,
  Field,
} from "@/components/controladoria/CrudControls";
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
  const empty = source === "empty" || (assets.length === 0 && liab.length === 0);

  const assetForm = (
    <CrudForm
      action={upsertAsset}
      title="+ Adicionar ativo"
      submitLabel="Salvar ativo"
      defaultOpen={empty}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="name" label="Ativo" required />
        <Field name="value" label="Valor" type="number" step="0.01" required />
        <Field name="asset_type" label="Tipo" defaultValue="Outro" />
        <Field name="notes" label="Observação" />
      </div>
    </CrudForm>
  );

  const liabForm = (
    <CrudForm action={upsertLiability} title="+ Adicionar passivo" submitLabel="Salvar passivo">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="name" label="Dívida / passivo" required />
        <Field name="balance" label="Saldo" type="number" step="0.01" required />
        <Field name="source" label="Fonte" placeholder="Empréstimo / Cartão" />
        <Field name="notes" label="Observação" />
        <CheckField name="is_consignado" label="É consignado (folha)" />
      </div>
    </CrudForm>
  );

  if (empty) {
    return (
      <div className="space-y-6">
        <PageTitle
          eyebrow="Patrimônio"
          title="Controle patrimonial"
          subtitle="Ativos − passivos (com/sem consignado)."
        />
        <EmptyState title="Patrimônio vazio" text="Importe a planilha ou adicione o primeiro item." />
        {assetForm}
        {liabForm}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow="Patrimônio"
        title="Controle patrimonial"
        subtitle="Adicione, edite ou exclua ativos e passivos."
      />

      {assetForm}
      {liabForm}

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
        <DataTable headers={["Ativo", "Valor", "Tipo", "Obs", "Ações"]}>
          {assets.map((a) => (
            <tr key={a.id} className="align-top">
              <td className="px-3 py-2.5 font-medium">
                {a.name}
                <EditForm action={upsertAsset}>
                  <input type="hidden" name="id" value={a.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field name="name" label="Ativo" required defaultValue={a.name} />
                    <Field name="value" label="Valor" type="number" step="0.01" required defaultValue={a.value} />
                    <Field name="asset_type" label="Tipo" defaultValue={a.asset_type} />
                    <Field name="notes" label="Obs" defaultValue={a.notes ?? ""} />
                  </div>
                </EditForm>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(a.value)}</td>
              <td className="px-3 py-2.5">{a.asset_type}</td>
              <td className="max-w-[14rem] truncate px-3 py-2.5 text-xs text-ink-muted">
                {a.notes}
              </td>
              <td className="px-3 py-2.5">
                <DeleteButton
                  action={deleteAsset}
                  id={a.id}
                  confirmMessage={`Excluir o ativo "${a.name}"?`}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent-deep">
          Passivos
        </h2>
        <DataTable headers={["Dívida", "Saldo", "Fonte", "Consignado", "Ações"]}>
          {bundle.liabilities.map((l) => (
            <tr key={l.id} className="align-top">
              <td className="px-3 py-2.5 font-medium">
                {l.name}
                <EditForm action={upsertLiability}>
                  <input type="hidden" name="id" value={l.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field name="name" label="Nome" required defaultValue={l.name} />
                    <Field name="balance" label="Saldo" type="number" step="0.01" required defaultValue={l.balance} />
                    <Field name="source" label="Fonte" defaultValue={l.source ?? ""} />
                    <Field name="notes" label="Obs" defaultValue={l.notes ?? ""} />
                    <CheckField name="is_consignado" label="Consignado" defaultChecked={l.is_consignado} />
                  </div>
                </EditForm>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(l.balance)}</td>
              <td className="px-3 py-2.5">{l.source}</td>
              <td className="px-3 py-2.5">{l.is_consignado ? "Sim" : "Não"}</td>
              <td className="px-3 py-2.5">
                <DeleteButton
                  action={deleteLiability}
                  id={l.id}
                  confirmMessage={`Excluir o passivo "${l.name}"?`}
                />
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
            <li>Prazo: {bundle.netWorthGoal.estimated_deadline ?? "—"}</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
