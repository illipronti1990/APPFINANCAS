"use client";

import { useState, useTransition } from "react";
import {
  importModeloPlanilha,
  importUploadedPlanilha,
} from "@/app/actions";
import { PageTitle } from "@/components/controladoria/ui";

export default function ImportarPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle
        eyebrow="Importar"
        title="Importar planilha Excel"
        subtitle="Carrega a estrutura da Controladoria Pessoal (Inicio, Agenda, Fluxo, Cartões…). Substitui os dados do usuário na nuvem. Não deixe saldos privados hardcoded no código — use esta importação."
      />

      <div className="rounded-2xl border border-line bg-surface/90 p-5 space-y-4">
        <h2 className="font-[family-name:var(--font-display)] font-semibold text-accent-deep">
          1. Planilha modelo do repositório
        </h2>
        <p className="text-sm text-ink-muted">
          Usa <code className="rounded bg-bg-soft px-1">data/planilha-modelo.xlsx</code>{" "}
          (cópia da planilha do Renan) e grava no Supabase da sua conta.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setMsg(null);
            setErr(null);
            start(async () => {
              const r = await importModeloPlanilha();
              if (r.error) setErr(r.error);
              if (r.success) setMsg(r.success);
            });
          }}
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
        >
          {pending ? "Importando…" : "Importar planilha modelo"}
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-surface/90 p-5 space-y-4">
        <h2 className="font-[family-name:var(--font-display)] font-semibold text-accent-deep">
          2. Enviar outro .xlsx
        </h2>
        <p className="text-sm text-ink-muted">
          Mesmas abas da planilha original (Inicio, Dashboard, Agenda, Contas_Ago_Jan,
          Fluxo_Diario, Fixos, Emprestimos, Cartoes, etc.).
        </p>
        <form
          action={(fd) => {
            setMsg(null);
            setErr(null);
            start(async () => {
              const r = await importUploadedPlanilha(fd);
              if (r.error) setErr(r.error);
              if (r.success) setMsg(r.success);
            });
          }}
          className="space-y-3"
        >
          <input
            type="file"
            name="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            required
            className="block w-full text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-accent-deep hover:bg-accent-soft disabled:opacity-60"
          >
            Enviar e importar
          </button>
        </form>
      </div>

      {err ? (
        <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>
      ) : null}
      {msg ? (
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-deep">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
