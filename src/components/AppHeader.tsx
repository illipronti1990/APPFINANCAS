import Link from "next/link";
import { signOut } from "@/app/actions";

export const NAV = [
  { href: "/inicio", label: "Início" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agenda", label: "Agenda" },
  { href: "/contas", label: "Contas" },
  { href: "/fluxo", label: "Fluxo" },
  { href: "/fixos", label: "Fixos" },
  { href: "/emprestimos", label: "Empréstimos" },
  { href: "/cartoes", label: "Cartões" },
  { href: "/cenarios", label: "Cenários" },
  { href: "/simulador", label: "Simulador" },
  { href: "/prioridades", label: "Prioridades" },
  { href: "/patrimonio", label: "Patrimônio" },
  { href: "/projecao", label: "Projeção" },
  { href: "/importar", label: "Importar" },
] as const;

export function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-[#f3f6f4]/92 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/inicio" className="no-underline">
            <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-accent-deep">
              APPFINANCAS
            </span>
            <span className="mt-0.5 block text-xs text-ink-muted">
              Controladoria Pessoal · Renan Illipronti
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {email ? (
              <span className="hidden max-w-[10rem] truncate text-sm text-ink-muted sm:inline">
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
        <nav className="flex gap-1 overflow-x-auto pb-1">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-ink-muted no-underline transition hover:bg-accent-soft hover:text-accent-deep"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
