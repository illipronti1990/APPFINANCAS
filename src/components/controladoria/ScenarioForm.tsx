"use client";

import { useTransition } from "react";
import { updateScenarioInputs } from "@/app/actions";
import type { ScenarioInputs } from "@/lib/domain/types";

export function ScenarioForm({
  initial,
  mode,
}: {
  initial: ScenarioInputs;
  mode: "scenario" | "simulator";
}) {
  const [pending, start] = useTransition();

  return (
    <form
      action={(fd) => {
        start(async () => {
          await updateScenarioInputs(fd);
        });
      }}
      className="grid gap-3 rounded-2xl border border-line bg-surface/90 p-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {mode === "scenario" ? (
        <>
          <Field
            name="caixa_livre"
            label="Caixa livre atual"
            defaultValue={initial.caixa_livre}
          />
          <Field
            name="extra_income"
            label="Recebi extra / freelance"
            defaultValue={initial.extra_income}
          />
          <Field name="bonus" label="Bônus / 13º / PLR" defaultValue={initial.bonus} />
          <Field
            name="asset_sale"
            label="Venda de bem"
            defaultValue={initial.asset_sale}
          />
          <Field
            name="other_amount"
            label="Outro valor"
            defaultValue={initial.other_amount}
          />
          <Field
            name="monthly_surplus"
            label="Superávit médio mensal"
            defaultValue={initial.monthly_surplus}
          />
          <input type="hidden" name="simulator_received" value={initial.simulator_received} />
        </>
      ) : (
        <>
          <Field
            name="simulator_received"
            label="RECEBI (digite aqui)"
            defaultValue={initial.simulator_received}
          />
          <input type="hidden" name="caixa_livre" value={initial.caixa_livre} />
          <input type="hidden" name="extra_income" value={initial.extra_income} />
          <input type="hidden" name="bonus" value={initial.bonus} />
          <input type="hidden" name="asset_sale" value={initial.asset_sale} />
          <input type="hidden" name="other_amount" value={initial.other_amount} />
          <input
            type="hidden"
            name="monthly_surplus"
            value={initial.monthly_surplus}
          />
        </>
      )}
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
        >
          {pending ? "Calculando…" : "Atualizar cálculo"}
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <input
        name={name}
        type="number"
        step="0.01"
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-line bg-white px-3 py-2"
      />
    </label>
  );
}
