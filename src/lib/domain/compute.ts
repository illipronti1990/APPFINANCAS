import type {
  AgendaItem,
  CashflowDay,
  ControladoriaBundle,
  CreditCard,
  DebtCandidate,
  Priority,
  ProjectionMonth,
  ScenarioInputs,
} from "./types";
import { formatCurrency } from "@/lib/format";

export type PaymentStatus = "Pago" | "A vencer" | "Vence em breve" | "Atrasado";

export function agendaStatus(
  item: AgendaItem,
  referenceDay: number,
): PaymentStatus {
  if (item.paid) return "Pago";
  if (item.due_day < referenceDay) return "Atrasado";
  if (item.due_day <= referenceDay + 3) return "Vence em breve";
  return "A vencer";
}

export function statusTone(status: PaymentStatus | string): string {
  const s = status.toLowerCase();
  if (
    s.includes("pago") ||
    s.includes("excelente") ||
    s.includes("feito") ||
    s.includes("saudável")
  ) {
    return "ok";
  }
  if (
    s.includes("breve") ||
    s.includes("atenção") ||
    s.includes("alto") ||
    s.includes("apertado")
  ) {
    return "warn";
  }
  if (
    s.includes("atrasad") ||
    s.includes("crítico") ||
    s.includes("urgente") ||
    s.includes("sem caixa") ||
    s.includes("déficit")
  ) {
    return "danger";
  }
  return "neutral";
}

export function cardUsageStatus(pct: number): string {
  if (pct <= 30) return "Excelente";
  if (pct <= 50) return "Atenção";
  if (pct <= 80) return "Alto";
  return "Crítico";
}

export function cardUsageTone(pct: number): "ok" | "warn" | "high" | "danger" {
  if (pct <= 30) return "ok";
  if (pct <= 50) return "warn";
  if (pct <= 80) return "high";
  return "danger";
}

export function incomeCommitmentTone(pct: number): "ok" | "warn" | "danger" {
  if (pct < 50) return "ok";
  if (pct < 70) return "warn";
  return "danger";
}

export function incomeCommitmentLabel(pct: number): string {
  if (pct < 50) return "Saudável (0–50%)";
  if (pct < 70) return "Atenção (50–70%)";
  return "Crítico (70%+)";
}

export function totalDebts(bundle: ControladoriaBundle): number {
  const loans = bundle.installmentLoans.reduce((s, l) => s + l.balance, 0);
  const open = bundle.openDebts.reduce((s, d) => s + d.total_balance, 0);
  return loans + open;
}

export function cardsMonthTotal(
  cards: CreditCard[],
  month: number,
  year: number,
): number {
  return cards.reduce((sum, card) => {
    const hit = card.schedule.find((s) => s.month === month && s.year === year);
    return sum + (hit?.amount ?? 0);
  }, 0);
}

export function nextPriority(priorities: Priority[]): Priority | null {
  return (
    priorities.find(
      (p) => !["feito", "em dia", "quitado"].includes(p.status.toLowerCase()),
    ) ?? null
  );
}

export function buildCashflowRows(
  opening: number,
  days: CashflowDay[],
  projectedEnd: number,
) {
  let balance = opening;
  return days
    .slice()
    .sort((a, b) => a.day - b.day)
    .map((d) => {
      const openingBal = balance;
      const closing = openingBal + d.inflows - d.outflows;
      balance = closing;
      return {
        ...d,
        opening: openingBal,
        closing,
        projected: projectedEnd,
        alert: closing < 0 ? ("SEM CAIXA" as const) : null,
      };
    });
}

export function computeDashboard(bundle: ControladoriaBundle) {
  const { settings, cashflow, projections, cards, alerts } = bundle;
  const year = settings.current_year;
  const month = settings.current_month;

  const proj = projections.find((p) => p.year === year && p.month === month);
  const income =
    proj?.income ||
    cashflow?.days.reduce((s, d) => s + d.inflows, 0) ||
    0;
  const expenses =
    cashflow?.days.reduce((s, d) => s + d.outflows, 0) ||
    proj?.commitments ||
    0;
  const surplus = income - expenses;
  const debts = totalDebts(bundle);
  const cardsAgo = cardsMonthTotal(cards, 8, year);

  const avgIncome =
    projections.length > 0
      ? projections.reduce((s, p) => s + p.income, 0) / projections.length
      : income;
  const avgCommit =
    projections.length > 0
      ? projections.reduce((s, p) => s + p.commitments, 0) / projections.length
      : expenses;
  const commitmentPct = avgIncome > 0 ? (avgCommit / avgIncome) * 100 : 0;

  const monthsLeft =
    settings.monthly_surplus > 0
      ? Math.ceil(debts / settings.monthly_surplus)
      : 0;
  const daysLeft = monthsLeft * 30;

  const debtSeries = buildSeries(debts, -settings.monthly_surplus, 12);
  const assets = bundle.assets.reduce((s, a) => s + a.value, 0);
  const passivos = bundle.liabilities
    .filter((l) => !l.is_consignado)
    .reduce((s, l) => s + l.balance, 0);
  const plSeries = buildSeries(
    assets - passivos,
    settings.monthly_surplus,
    12,
  );

  const nextRecv = findNextReceivable(cashflow, settings.reference_day);
  const hojeVence = bundle.agenda.filter(
    (a) =>
      a.year === year &&
      a.month === month &&
      a.due_day === settings.reference_day,
  );
  const next7 = bundle.agenda
    .filter((a) => {
      if (a.year !== year || a.month !== month) return false;
      const diff = a.due_day - settings.reference_day;
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => a.due_day - b.due_day);

  const fluxoSaldo = cashflow
    ? (buildCashflowRows(cashflow.opening_balance, cashflow.days, surplus).find(
        (r) => r.day === settings.reference_day,
      )?.closing ?? 0)
    : 0;

  return {
    income,
    expenses,
    surplus,
    debts,
    caixaLivre: settings.caixa_livre,
    cardsMonth: cardsAgo,
    commitmentPct,
    monthsLeft,
    daysLeft,
    debtSeries,
    plSeries,
    alerts,
    nextRecv,
    hojeVence,
    next7,
    fluxoSaldo,
    priority: nextPriority(bundle.priorities),
  };
}

function buildSeries(start: number, delta: number, n: number) {
  const out: { label: string; value: number }[] = [];
  let v = start;
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push({
      label: `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`,
      value: Math.max(delta < 0 ? 0 : v, delta < 0 ? Math.max(0, v) : v),
    });
    v += delta;
    if (delta < 0) v = Math.max(0, v);
  }
  return out;
}

function findNextReceivable(
  cashflow: ControladoriaBundle["cashflow"],
  referenceDay: number,
) {
  if (!cashflow) return null;
  const hit = cashflow.days
    .filter((d) => d.day >= referenceDay && d.inflows > 0)
    .sort((a, b) => a.day - b.day)[0];
  if (!hit) return null;
  const label =
    hit.events
      ?.split("|")
      .map((e) => e.trim())
      .find((e) => e.startsWith("+"))
      ?.replace(/^\+\s*/, "")
      .trim() || "Recebimento";
  return { day: hit.day, amount: hit.inflows, label };
}

export type SimComparison = DebtCandidate & {
  economy: number;
  fits: boolean;
  leftover: number;
  interestSaved: number;
  displayName: string;
};

export function runSimulator(received: number, candidates: DebtCandidate[]) {
  const comparisons: SimComparison[] = candidates.map((c) => {
    const economy = Math.max(0, c.cancels_amount - c.cost_to_act);
    const fits = received >= c.cost_to_act && c.cost_to_act > 0;
    return {
      ...c,
      economy,
      fits,
      leftover: fits ? received - c.cost_to_act : 0,
      interestSaved:
        Math.min(received, c.cost_to_act || received) *
        (c.interest_rate_month / 100),
      displayName: c.name,
    };
  });

  const risk = comparisons.find((c) => c.is_risk_first);
  const mp = comparisons.find((c) => /mercado\s*pago/i.test(c.name));

  let recommendation: SimComparison | null = null;

  if (risk && received >= risk.cost_to_act && risk.cost_to_act > 0) {
    recommendation = { ...risk, displayName: risk.name };
  } else if (mp?.fits && (!risk || risk.cost_to_act <= 0)) {
    recommendation = mp;
  } else if (risk && received > 0) {
    recommendation = {
      ...risk,
      fits: true,
      leftover: 0,
      economy: 0,
      interestSaved: received * (risk.interest_rate_month / 100),
      displayName: `${risk.name} (parcial)`,
    };
  } else {
    recommendation = comparisons.find((c) => c.fits) ?? comparisons[0] ?? null;
  }

  return { recommendation, comparisons, received };
}

export function runScenarioPlan(
  inputs: ScenarioInputs,
  candidates: DebtCandidate[],
  currentDebts: number,
) {
  const total =
    inputs.caixa_livre +
    inputs.extra_income +
    inputs.bonus +
    inputs.asset_sale +
    inputs.other_amount;

  const ordered = [...candidates].sort((a, b) => {
    if (a.is_risk_first === b.is_risk_first) return 0;
    return a.is_risk_first ? -1 : 1;
  });

  let remaining = total;
  const steps: {
    action: string;
    applied: number;
    leftover: number;
    effect: string;
  }[] = [];

  for (const c of ordered.slice(0, 4)) {
    if (remaining <= 0 || c.cost_to_act <= 0) {
      steps.push({
        action: `${c.name} — não cabe`,
        applied: 0,
        leftover: remaining,
        effect: "—",
      });
      continue;
    }
    const apply = Math.min(remaining, c.cost_to_act);
    remaining -= apply;
    const interest = apply * (c.interest_rate_month / 100);
    const full = apply >= c.cost_to_act;
    steps.push({
      action: full ? c.name : `${c.name} — amortizar`,
      applied: apply,
      leftover: remaining,
      effect: full
        ? `Economia ${formatCurrency(Math.max(0, c.cancels_amount - c.cost_to_act))}`
        : `Reduzido em ${formatCurrency(apply)}; ~${formatCurrency(interest)}/mês evitados`,
    });
  }

  const interestSaved = steps.reduce((s, step, i) => {
    const c = ordered[i];
    if (!c) return s;
    return s + step.applied * (c.interest_rate_month / 100);
  }, 0);

  const appliedTotal = total - remaining;
  const debtsAfter = Math.max(0, currentDebts - appliedTotal);
  const surplusAfter = inputs.monthly_surplus + interestSaved;
  const monthsBefore =
    inputs.monthly_surplus > 0
      ? Math.ceil(currentDebts / inputs.monthly_surplus)
      : 0;
  const monthsAfter =
    surplusAfter > 0 ? Math.ceil(debtsAfter / surplusAfter) : 0;
  const daysGained = Math.max(0, (monthsBefore - monthsAfter) * 30);

  return {
    total,
    steps,
    interestSaved,
    debtsAfter,
    surplusAfter,
    monthsAfter,
    daysGained,
    quitePrimeiro: steps[0]?.action ?? "—",
  };
}

export function projectionRows(projections: ProjectionMonth[]) {
  return projections.map((p) => {
    const saldo = p.income - p.commitments;
    const pct = p.income > 0 ? (p.commitments / p.income) * 100 : 0;
    return {
      ...p,
      saldo,
      pct,
      situacao: saldo < 0 ? "Déficit" : pct > 90 ? "Apertado" : "Superávit",
    };
  });
}
