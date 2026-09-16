import { emptyBundle, type ControladoriaBundle } from "@/lib/domain/types";
import { parseWorkbookFromFile } from "@/lib/import/excel";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import path from "path";

export async function loadBundle(): Promise<{
  bundle: ControladoriaBundle;
  source: "preview" | "supabase" | "empty";
  email?: string | null;
}> {
  if (process.env.APP_UI_PREVIEW === "1") {
    const file = path.join(process.cwd(), "data", "planilha-modelo.xlsx");
    const bundle = await parseWorkbookFromFile(file);
    return { bundle, source: "preview", email: "renan@exemplo.com" };
  }

  const { isConfigured } = getSupabaseEnv();
  if (!isConfigured) {
    return { bundle: emptyBundle(), source: "empty" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { bundle: emptyBundle(), source: "empty" };
  }

  const bundle = await loadFromSupabase(user.id);
  return { bundle, source: "supabase", email: user.email };
}

async function loadFromSupabase(userId: string): Promise<ControladoriaBundle> {
  const supabase = await createClient();
  const bundle = emptyBundle();

  const [
    settingsRes,
    agendaRes,
    matrixRes,
    fixedRes,
    loansRes,
    openRes,
    parcelsRes,
    cardsRes,
    cfMonthRes,
    cfDaysRes,
    priRes,
    assetsRes,
    liabRes,
    goalRes,
    projRes,
    alertsRes,
    candRes,
    scenRes,
  ] = await Promise.all([
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("agenda_items").select("*").eq("user_id", userId).order("due_day"),
    supabase.from("bill_matrix_rows").select("*, bill_matrix_amounts(*)").eq("user_id", userId),
    supabase.from("fixed_expenses").select("*").eq("user_id", userId).order("due_day"),
    supabase.from("installment_loans").select("*").eq("user_id", userId),
    supabase.from("open_debts").select("*").eq("user_id", userId).order("priority"),
    supabase.from("loan_parcels").select("*").eq("user_id", userId).order("parcel_index"),
    supabase.from("credit_cards").select("*, card_schedules(*)").eq("user_id", userId),
    supabase.from("cashflow_months").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("cashflow_days").select("*").eq("user_id", userId).order("day"),
    supabase.from("priorities").select("*").eq("user_id", userId).order("sort_order"),
    supabase.from("assets").select("*").eq("user_id", userId),
    supabase.from("liability_entries").select("*").eq("user_id", userId),
    supabase.from("net_worth_goals").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("projection_months").select("*").eq("user_id", userId).order("year").order("month"),
    supabase.from("alerts").select("*").eq("user_id", userId),
    supabase.from("debt_candidates").select("*").eq("user_id", userId).order("sort_order"),
    supabase.from("scenario_inputs").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (settingsRes.data) {
    bundle.settings = {
      display_name: settingsRes.data.display_name,
      reference_day: settingsRes.data.reference_day,
      caixa_livre: Number(settingsRes.data.caixa_livre),
      monthly_surplus: Number(settingsRes.data.monthly_surplus),
      current_month: settingsRes.data.current_month,
      current_year: settingsRes.data.current_year,
    };
  }

  bundle.agenda = (agendaRes.data ?? []).map((r) => ({
    id: r.id,
    due_day: r.due_day,
    account_name: r.account_name,
    amount: Number(r.amount),
    paid: r.paid,
    category: r.category,
    month: r.month,
    year: r.year,
    notes: r.notes,
  }));

  bundle.billMatrix = (matrixRes.data ?? []).map((r) => ({
    id: r.id,
    account_name: r.account_name,
    due_day: r.due_day,
    source: r.source,
    paid: r.paid,
    notes: r.notes,
    amounts: (r.bill_matrix_amounts ?? []).map(
      (a: { year: number; month: number; amount: number }) => ({
        year: a.year,
        month: a.month,
        amount: Number(a.amount),
      }),
    ),
  }));

  bundle.fixedExpenses = (fixedRes.data ?? []).map((r) => ({
    id: r.id,
    account_name: r.account_name,
    category: r.category,
    amount: Number(r.amount),
    due_day: r.due_day,
    bank: r.bank,
    until_when: r.until_when,
    paid: r.paid,
    notes: r.notes,
  }));

  bundle.installmentLoans = (loansRes.data ?? []).map((r) => ({
    id: r.id,
    bank: r.bank,
    balance: Number(r.balance),
    installment: Number(r.installment),
    remaining: r.remaining,
    end_estimated: r.end_estimated,
    status: r.status,
  }));

  bundle.openDebts = (openRes.data ?? []).map((r) => ({
    id: r.id,
    bank: r.bank,
    total_balance: Number(r.total_balance),
    overdue: Number(r.overdue),
    payoff_amount: Number(r.payoff_amount),
    priority: r.priority,
    status: r.status,
    strategy: r.strategy,
    interest_rate_month: Number(r.interest_rate_month ?? 0),
  }));

  bundle.loanParcels = (parcelsRes.data ?? []).map((r) => ({
    id: r.id,
    debt_label: r.debt_label,
    parcel_index: r.parcel_index,
    parcel_number: r.parcel_number,
    situation: r.situation,
    amount: Number(r.amount),
    amount_with_interest: Number(r.amount_with_interest),
  }));

  bundle.cards = (cardsRes.data ?? []).map((r) => ({
    id: r.id,
    bank: r.bank,
    card_name: r.card_name,
    limit_total: Number(r.limit_total),
    used_amount: Number(r.used_amount),
    close_day: r.close_day,
    due_day: r.due_day,
    current_bill: Number(r.current_bill),
    next_bill: Number(r.next_bill),
    remaining_installments: Number(r.remaining_installments),
    schedule: (r.card_schedules ?? []).map(
      (s: { year: number; month: number; amount: number }) => ({
        year: s.year,
        month: s.month,
        amount: Number(s.amount),
      }),
    ),
  }));

  if (cfMonthRes.data) {
    bundle.cashflow = {
      year: cfMonthRes.data.year,
      month: cfMonthRes.data.month,
      opening_balance: Number(cfMonthRes.data.opening_balance),
      caixa_livre: Number(cfMonthRes.data.caixa_livre),
      days: (cfDaysRes.data ?? []).map((d) => ({
        id: d.id,
        year: d.year,
        month: d.month,
        day: d.day,
        inflows: Number(d.inflows),
        outflows: Number(d.outflows),
        events: d.events,
      })),
    };
  }

  bundle.priorities = (priRes.data ?? []).map((r) => ({
    id: r.id,
    sort_order: r.sort_order,
    debt_name: r.debt_name,
    action: r.action,
    amount: r.amount == null ? null : Number(r.amount),
    status: r.status,
    reason: r.reason,
  }));

  bundle.assets = (assetsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    value: Number(r.value),
    asset_type: r.asset_type,
    notes: r.notes,
  }));

  bundle.liabilities = (liabRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    balance: Number(r.balance),
    source: r.source,
    notes: r.notes,
    is_consignado: r.is_consignado,
  }));

  if (goalRes.data) {
    bundle.netWorthGoal = {
      home_target: Number(goalRes.data.home_target),
      credit_letter: Number(goalRes.data.credit_letter),
      down_payment_needed: Number(goalRes.data.down_payment_needed),
      down_payment_missing: Number(goalRes.data.down_payment_missing),
      estimated_deadline: goalRes.data.estimated_deadline,
      strategy: goalRes.data.strategy,
    };
  }

  bundle.projections = (projRes.data ?? []).map((r) => ({
    year: r.year,
    month: r.month,
    commitments: Number(r.commitments),
    income: Number(r.income),
    notes: r.notes,
  }));

  bundle.alerts = (alertsRes.data ?? []).map((r) => ({
    id: r.id,
    severity: r.severity,
    title: r.title,
    message: r.message,
  }));

  bundle.debtCandidates = (candRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    cost_to_act: Number(r.cost_to_act),
    cancels_amount: Number(r.cancels_amount),
    interest_rate_month: Number(r.interest_rate_month),
    installment_freed: Number(r.installment_freed),
    is_risk_first: r.is_risk_first,
  }));

  if (scenRes.data) {
    bundle.scenario = {
      caixa_livre: Number(scenRes.data.caixa_livre),
      extra_income: Number(scenRes.data.extra_income),
      bonus: Number(scenRes.data.bonus),
      asset_sale: Number(scenRes.data.asset_sale),
      other_amount: Number(scenRes.data.other_amount),
      monthly_surplus: Number(scenRes.data.monthly_surplus),
      simulator_received: Number(scenRes.data.simulator_received),
    };
  }

  return bundle;
}
