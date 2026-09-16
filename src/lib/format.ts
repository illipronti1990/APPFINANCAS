import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

export function monthLabel(month: number, year: number): string {
  const d = new Date(year, month - 1, 1);
  const label = format(d, "MMM/yy", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function fullMonthLabel(month: number, year: number): string {
  const d = new Date(year, month - 1, 1);
  const label = format(d, "MMMM/yyyy", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function greetingForNow(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function weekdayLabel(date = new Date()): string {
  return format(date, "EEEE", { locale: ptBR });
}

export function parseMoney(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (raw == null || raw === "") return 0;
  let s = String(raw).trim();
  if (!s || s === "—" || s === "-") return 0;
  s = s.replace(/R\$\s?/gi, "").replace(/\s/g, "");
  // accounting negatives like (1,234.56) or (2.940,84)
  const neg = s.includes("(") && s.includes(")");
  s = s.replace(/[()]/g, "");
  if (s.includes(",") && s.includes(".")) {
    // BR: 1.234,56 or US mixed — if last separator is comma, BR
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return neg ? -Math.abs(n) : n;
}

export function parseDay(raw: unknown): number {
  const n = Number(String(raw).replace(/\D/g, ""));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(31, Math.floor(n));
}

export function parsePaid(raw: unknown): boolean {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  return s === "S" || s === "SIM" || s === "PAGO" || s === "TRUE" || s === "1";
}

export function parseMonthToken(token: string): { month: number; year: number } | null {
  // Ago/26, Jul/2026, Jan/27
  const m = token.trim().match(/^([A-Za-zçÇãõéÉ\.]+)[\/\-]?(\d{2,4})$/i);
  if (!m) return null;
  const map: Record<string, number> = {
    jan: 1,
    fev: 2,
    mar: 3,
    abr: 4,
    mai: 5,
    jun: 6,
    jul: 7,
    ago: 8,
    set: 9,
    out: 10,
    nov: 11,
    dez: 12,
  };
  const key = m[1].toLowerCase().slice(0, 3);
  const month = map[key];
  if (!month) return null;
  let year = Number(m[2]);
  if (year < 100) year += 2000;
  return { month, year };
}
