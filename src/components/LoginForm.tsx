"use client";

import { useState, useTransition } from "react";
import {
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
} from "@/app/actions";

type Mode = "login" | "signup" | "magic";

type ActionResult = { error?: string; success?: string } | void;

export function LoginForm({ configured }: { configured: boolean }) {
  const [mode, setMode] = useState<Mode>("login");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: (formData: FormData) => Promise<ActionResult>) {
    return (formData: FormData) => {
      setMessage(null);
      setError(null);
      startTransition(async () => {
        const result = await action(formData);
        if (result?.error) setError(result.error);
        if (result?.success) setMessage(result.success);
      });
    };
  }

  if (!configured) {
    return (
      <div className="rounded-2xl border border-line bg-surface/90 p-6 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-accent-deep">
          Configure o Supabase
        </h2>
        <p className="mt-3 text-ink-muted">
          Copie <code className="rounded bg-bg-soft px-1.5 py-0.5 text-sm">.env.example</code>{" "}
          para <code className="rounded bg-bg-soft px-1.5 py-0.5 text-sm">.env.local</code>,
          preencha URL e anon key, e rode a migration SQL em{" "}
          <code className="rounded bg-bg-soft px-1.5 py-0.5 text-sm">
            supabase/migrations/001_transactions.sql
          </code>
          .
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          Depois reinicie o servidor com <code>npm run dev</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface/90 p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["login", "Entrar"],
            ["signup", "Criar conta"],
            ["magic", "Link mágico"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
              setMessage(null);
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              mode === value
                ? "bg-accent text-white"
                : "border border-line text-ink-muted hover:bg-accent-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "login" ? (
        <form action={run(signInWithPassword)} className="space-y-4">
          <Field
            id="email"
            name="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            required
          />
          <Field
            id="password"
            name="password"
            label="Senha"
            type="password"
            autoComplete="current-password"
            required
          />
          <Submit pending={pending}>Entrar</Submit>
        </form>
      ) : null}

      {mode === "signup" ? (
        <form action={run(signUpWithPassword)} className="space-y-4">
          <Field
            id="email"
            name="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            required
          />
          <Field
            id="password"
            name="password"
            label="Senha (mín. 6 caracteres)"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
          />
          <Submit pending={pending}>Criar conta</Submit>
        </form>
      ) : null}

      {mode === "magic" ? (
        <form action={run(signInWithMagicLink)} className="space-y-4">
          <p className="text-sm text-ink-muted">
            Enviamos um link de acesso para o seu e-mail — sem senha.
          </p>
          <Field
            id="email"
            name="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            required
          />
          <Submit pending={pending}>Enviar link</Submit>
        </form>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-deep">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type,
  autoComplete,
  required,
  minLength,
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none transition focus:border-accent"
      />
    </label>
  );
}

function Submit({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-accent px-4 py-2.5 font-[family-name:var(--font-display)] font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60"
    >
      {pending ? "Aguarde…" : children}
    </button>
  );
}
