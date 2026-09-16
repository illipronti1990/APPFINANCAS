"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/app/actions";
import {
  categoriesForKind,
  kindLabel,
  type Transaction,
  type TransactionKind,
} from "@/lib/types";
import { todayISO } from "@/lib/format";

type Props =
  | { mode: "create"; initial?: Partial<Transaction> }
  | { mode: "edit"; initial: Transaction };

export function TransactionForm(props: Props) {
  const initialKind =
    props.initial?.kind ?? ("gasto" as TransactionKind);
  const [kind, setKind] = useState<TransactionKind>(initialKind);
  const [category, setCategory] = useState(props.initial?.category ?? "");
  const [customCategory, setCustomCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const categories = useMemo(() => categoriesForKind(kind), [kind]);

  function onKindChange(next: TransactionKind) {
    setKind(next);
    setCategory("");
    setCustomCategory(false);
  }

  function submit(formData: FormData) {
    formData.set("kind", kind);
    if (customCategory) {
      formData.set("category", String(formData.get("category_custom") ?? "").trim());
    }
    setError(null);
    startTransition(async () => {
      const action =
        props.mode === "edit" ? updateTransaction : createTransaction;
      const result = await action(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={submit} className="space-y-5">
      {props.mode === "edit" ? (
        <input type="hidden" name="id" value={props.initial.id} />
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">Tipo</legend>
        <div className="flex flex-wrap gap-2">
          {(["gasto", "deixei_de_gastar"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onKindChange(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                kind === value
                  ? "bg-accent text-white"
                  : "border border-line text-ink-muted hover:bg-accent-soft"
              }`}
            >
              {kindLabel(value)}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">Valor (R$)</span>
        <input
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          required
          defaultValue={props.initial?.amount ?? ""}
          placeholder="0,00"
          className="w-full rounded-xl border border-line bg-white px-3 py-2.5"
        />
      </label>

      <div className="space-y-1.5">
        <span className="text-sm font-medium text-ink">
          {kind === "gasto" ? "Categoria" : "Categoria / motivo"}
        </span>
        {!customCategory ? (
          <select
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5"
          >
            <option value="" disabled>
              Selecione…
            </option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="category_custom"
            required
            placeholder="Digite a categoria"
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5"
          />
        )}
        <button
          type="button"
          onClick={() => {
            setCustomCategory((v) => !v);
            setCategory("");
          }}
          className="text-sm text-accent-deep underline-offset-2 hover:underline"
        >
          {customCategory ? "Usar lista sugerida" : "Outra categoria"}
        </button>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">Data</span>
        <input
          name="occurred_on"
          type="date"
          required
          defaultValue={props.initial?.occurred_on ?? todayISO()}
          className="w-full rounded-xl border border-line bg-white px-3 py-2.5"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">
          Observação <span className="font-normal text-ink-muted">(opcional)</span>
        </span>
        <textarea
          name="note"
          rows={3}
          defaultValue={props.initial?.note ?? ""}
          placeholder="Ex.: almoço com colegas"
          className="w-full resize-y rounded-xl border border-line bg-white px-3 py-2.5"
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-4 py-2.5 font-[family-name:var(--font-display)] font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending
          ? "Salvando…"
          : props.mode === "edit"
            ? "Salvar alterações"
            : "Salvar lançamento"}
      </button>
    </form>
  );
}

export function DeleteTransactionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await deleteTransaction(formData);
          if (result?.error) setError(result.error);
        });
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (!confirm("Excluir este lançamento?")) {
            e.preventDefault();
          }
        }}
        className="text-sm text-danger underline-offset-2 hover:underline disabled:opacity-60"
      >
        {pending ? "Excluindo…" : "Excluir"}
      </button>
      {error ? <span className="ml-2 text-xs text-danger">{error}</span> : null}
    </form>
  );
}
