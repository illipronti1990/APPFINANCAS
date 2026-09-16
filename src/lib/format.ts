import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), "dd/MM/yyyy", { locale: ptBR });
}

export function formatMonthYear(date = new Date()): string {
  const label = format(date, "MMMM yyyy", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function currentMonthRange(date = new Date()): {
  start: string;
  end: string;
} {
  return {
    start: format(startOfMonth(date), "yyyy-MM-dd"),
    end: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

export function parseAmount(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}
