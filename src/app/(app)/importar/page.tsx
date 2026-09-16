"use client";

import { useState, useTransition } from "react";
import {
  importModeloPlanilha,
  importUploadedPlanilha,
} from "@/app/actions";
import { wipeAllUserData } from "@/app/actions/crud";
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
        subtitle="Carga em massa da Controladoria. Depois use Adicionar/Editar/Excluir em cada tela para ajustes pontuais — sem reimportar tudo."
      />

      <div className="rounded-2xl border border-line bg-surface/90 p-5 space-y-4">
        <h2 className="font-[family-name:var(--font-display)] font-semibold text-accent-deep">
          1. Planilha modelo do repositório
        </h2>
        <p className="text-sm text-ink-muted">
          Usa <code className="rounded bg-bg-soft px-1">data/planilha-modelo.xlsx</code> e grava
          no Supabase da sua conta (substitui os dados atuais).
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
          Mesmas abas da planilha original (Inicio, Agenda, Contas_Ago_Jan, Fluxo_Diario,
          Fixos, Emprestimos, Cartoes, etc.).
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

      <div className="rounded-2xl border border-danger/40 bg-danger-soft/40 p-5 space-y-4">
        <h2 className="font-[family-name:var(--font-display)] font-semibold text-danger">
          Zona de perigo — apagar tudo
        </h2>
        <p className="text-sm text-ink">
          Remove <strong>todos</strong> os seus dados na nuvem (agenda, fixos, cartões, fluxo,
          dívidas, patrimônio…). A conta de login permanece. Depois você pode importar de novo.
        </p>
        <form
          action={(fd) => {
            if (
              !confirm(
                "Tem certeza? Isso apaga TODOS os seus dados financeiros na nuvem.",
              )
            ) {
              return;
            }
            setMsg(null);
            setErr(null);
            start(async () => {
              const r = await wipeAllUserData(fd);
              if (r.error) setErr(r.error);
              if (r.success) setMsg(r.success);
            });
          }}
          className="space-y-3"
        >
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Digite APAGAR para confirmar</span>
            <input
              name="confirm"
              required
              placeholder="APAGAR"
              className="w-full rounded-xl border border-danger/40 bg-white px-3 py-2.5"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-danger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Apagar todos os meus dados
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
