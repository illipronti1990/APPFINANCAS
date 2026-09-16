"use client";

import { useState, useTransition } from "react";

type ActionResult = { error?: string; success?: string } | void;

export function DeleteButton({
  action,
  id,
  label = "Excluir",
  confirmMessage = "Excluir este item? Esta ação não pode ser desfeita.",
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  id: string;
  label?: string;
  confirmMessage?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        if (!confirm(confirmMessage)) return;
        setError(null);
        start(async () => {
          const result = await action(fd);
          if (result?.error) setError(result.error);
        });
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-danger underline-offset-2 hover:underline disabled:opacity-60"
      >
        {pending ? "Excluindo…" : label}
      </button>
      {error ? <span className="ml-2 text-xs text-danger">{error}</span> : null}
    </form>
  );
}

export function CrudForm({
  action,
  title,
  children,
  submitLabel = "Salvar",
  defaultOpen = false,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  title: string;
  children: React.ReactNode;
  submitLabel?: string;
  defaultOpen?: boolean;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-line bg-surface/90 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="font-[family-name:var(--font-display)] font-semibold text-accent-deep">
          {title}
        </span>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
          {open ? "Fechar" : "Adicionar"}
        </span>
      </button>
      {open ? (
        <form
          action={(fd) => {
            setMessage(null);
            setError(null);
            start(async () => {
              const result = await action(fd);
              if (result?.error) setError(result.error);
              if (result?.success) {
                setMessage(result.success);
                setOpen(false);
              }
            });
          }}
          className="space-y-3 border-t border-line px-4 py-4"
        >
          {children}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60 sm:w-auto"
          >
            {pending ? "Salvando…" : submitLabel}
          </button>
          {error ? (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-deep">
              {message}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

export function EditForm({
  action,
  children,
  submitLabel = "Salvar",
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-accent-deep hover:underline"
      >
        Editar
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-line bg-bg-soft/50 p-3">
      <form
        action={(fd) => {
          setError(null);
          start(async () => {
            const result = await action(fd);
            if (result?.error) setError(result.error);
            else setOpen(false);
          });
        }}
        className="space-y-2"
      >
        {children}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "…" : submitLabel}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-line px-3 py-1.5 text-sm"
          >
            Cancelar
          </button>
        </div>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </form>
    </div>
  );
}

export function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
  min,
  max,
  step,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-xl border border-line bg-white px-3 py-2.5"
      />
    </label>
  );
}

export function CheckField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 rounded border-line"
      />
      <span>{label}</span>
    </label>
  );
}

export function ActionFeedback({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setMessage(null);
        setError(null);
        start(async () => {
          const result = await action(fd);
          if (result?.error) setError(result.error);
          if (result?.success) setMessage(result.success);
        });
      }}
      className={className}
    >
      {children}
      {pending ? (
        <p className="text-sm text-ink-muted">Processando…</p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-deep">
          {message}
        </p>
      ) : null}
    </form>
  );
}
