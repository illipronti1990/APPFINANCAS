import Link from "next/link";
import { signOut } from "@/app/actions";

const links = [
  { href: "/dashboard", label: "Painel" },
  { href: "/transacoes", label: "Lançamentos" },
  { href: "/categorias", label: "Categorias" },
] as const;

export function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-[#f3f6f4]/92 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="no-underline">
            <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-accent-deep">
              APPFINANCAS
            </span>
            <span className="mt-0.5 block text-xs text-ink-muted">
              Renan Illipronti
            </span>
          </Link>
          <form action={signOut} className="sm:hidden">
            <button
              type="submit"
              className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-muted"
            >
              Sair
            </button>
          </form>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-ink-muted no-underline transition hover:bg-accent-soft hover:text-accent-deep"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/transacoes/nova"
            className="ml-1 shrink-0 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-white no-underline transition hover:bg-accent-deep"
          >
            + Novo
          </Link>
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {email ? (
            <span className="max-w-[12rem] truncate text-sm text-ink-muted">
              {email}
            </span>
          ) : null}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-muted transition hover:bg-accent-soft"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
