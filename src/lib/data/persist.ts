import type { ControladoriaBundle } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/server";

/** Apaga dados do usuário e reinsere o bundle (importação da planilha). */
export async function replaceUserBundle(
  userId: string,
  bundle: ControladoriaBundle,
) {
  const supabase = await createClient();

  const tables = [
    "card_schedules",
    "bill_matrix_amounts",
    "agenda_items",
    "bill_matrix_rows",
    "fixed_expenses",
    "installment_loans",
    "open_debts",
    "loan_parcels",
    "credit_cards",
    "cashflow_days",
    "cashflow_months",
    "priorities",
    "assets",
    "liability_entries",
    "net_worth_goals",
    "projection_months",
    "alerts",
    "debt_candidates",
    "scenario_inputs",
    "user_settings",
  ] as const;

  for (const table of tables) {
    await supabase.from(table).delete().eq("user_id", userId);
  }

  const { error: settingsError } = await supabase.from("user_settings").insert({
    user_id: userId,
    ...bundle.settings,
  });
  if (settingsError) throw new Error(settingsError.message);

  if (bundle.agenda.length) {
    const { error } = await supabase.from("agenda_items").insert(
      bundle.agenda.map((a) => ({
        user_id: userId,
        due_day: a.due_day,
        account_name: a.account_name,
        amount: a.amount,
        paid: a.paid,
        category: a.category,
        month: a.month,
        year: a.year,
        notes: a.notes,
      })),
    );
    if (error) throw new Error(error.message);
  }

  for (const row of bundle.billMatrix) {
    const { data, error } = await supabase
      .from("bill_matrix_rows")
      .insert({
        user_id: userId,
        account_name: row.account_name,
        due_day: row.due_day,
        source: row.source,
        paid: row.paid,
        notes: row.notes,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (row.amounts.length) {
      const { error: ae } = await supabase.from("bill_matrix_amounts").insert(
        row.amounts.map((a) => ({
          row_id: data.id,
          user_id: userId,
          year: a.year,
          month: a.month,
          amount: a.amount,
        })),
      );
      if (ae) throw new Error(ae.message);
    }
  }

  if (bundle.fixedExpenses.length) {
    const { error } = await supabase.from("fixed_expenses").insert(
      bundle.fixedExpenses.map((f, i) => ({
        user_id: userId,
        account_name: f.account_name,
        category: f.category,
        amount: f.amount,
        due_day: f.due_day,
        bank: f.bank,
        until_when: f.until_when,
        paid: f.paid,
        notes: f.notes,
        sort_order: i,
      })),
    );
    if (error) throw new Error(error.message);
  }

  if (bundle.installmentLoans.length) {
    const { error } = await supabase.from("installment_loans").insert(
      bundle.installmentLoans.map((l, i) => ({
        user_id: userId,
        bank: l.bank,
        balance: l.balance,
        installment: l.installment,
        remaining: l.remaining,
        end_estimated: l.end_estimated,
        status: l.status,
        sort_order: i,
      })),
    );
    if (error) throw new Error(error.message);
  }

  if (bundle.openDebts.length) {
    const { error } = await supabase.from("open_debts").insert(
      bundle.openDebts.map((d, i) => ({
        user_id: userId,
        bank: d.bank,
        total_balance: d.total_balance,
        overdue: d.overdue,
        payoff_amount: d.payoff_amount,
        priority: d.priority,
        status: d.status,
        strategy: d.strategy,
        interest_rate_month: d.interest_rate_month ?? 0,
        sort_order: i,
      })),
    );
    if (error) throw new Error(error.message);
  }

  if (bundle.loanParcels.length) {
    const { error } = await supabase.from("loan_parcels").insert(
      bundle.loanParcels.map((p) => ({
        user_id: userId,
        debt_label: p.debt_label,
        parcel_index: p.parcel_index,
        parcel_number: p.parcel_number,
        situation: p.situation,
        amount: p.amount,
        amount_with_interest: p.amount_with_interest,
      })),
    );
    if (error) throw new Error(error.message);
  }

  for (const card of bundle.cards) {
    const { data, error } = await supabase
      .from("credit_cards")
      .insert({
        user_id: userId,
        bank: card.bank,
        card_name: card.card_name,
        limit_total: card.limit_total,
        used_amount: card.used_amount,
        close_day: card.close_day,
        due_day: card.due_day,
        current_bill: card.current_bill,
        next_bill: card.next_bill,
        remaining_installments: card.remaining_installments,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (card.schedule.length) {
      const { error: se } = await supabase.from("card_schedules").insert(
        card.schedule.map((s) => ({
          card_id: data.id,
          user_id: userId,
          year: s.year,
          month: s.month,
          amount: s.amount,
        })),
      );
      if (se) throw new Error(se.message);
    }
  }

  if (bundle.cashflow) {
    const { error } = await supabase.from("cashflow_months").insert({
      user_id: userId,
      year: bundle.cashflow.year,
      month: bundle.cashflow.month,
      opening_balance: bundle.cashflow.opening_balance,
      caixa_livre: bundle.cashflow.caixa_livre,
    });
    if (error) throw new Error(error.message);
    if (bundle.cashflow.days.length) {
      const { error: de } = await supabase.from("cashflow_days").insert(
        bundle.cashflow.days.map((d) => ({
          user_id: userId,
          year: d.year,
          month: d.month,
          day: d.day,
          inflows: d.inflows,
          outflows: d.outflows,
          events: d.events,
        })),
      );
      if (de) throw new Error(de.message);
    }
  }

  if (bundle.priorities.length) {
    const { error } = await supabase.from("priorities").insert(
      bundle.priorities.map((p) => ({
        user_id: userId,
        sort_order: p.sort_order,
        debt_name: p.debt_name,
        action: p.action,
        amount: p.amount,
        status: p.status,
        reason: p.reason,
      })),
    );
    if (error) throw new Error(error.message);
  }

  if (bundle.assets.length) {
    const { error } = await supabase.from("assets").insert(
      bundle.assets.map((a, i) => ({
        user_id: userId,
        name: a.name,
        value: a.value,
        asset_type: a.asset_type,
        notes: a.notes,
        sort_order: i,
      })),
    );
    if (error) throw new Error(error.message);
  }

  if (bundle.liabilities.length) {
    const { error } = await supabase.from("liability_entries").insert(
      bundle.liabilities.map((l, i) => ({
        user_id: userId,
        name: l.name,
        balance: l.balance,
        source: l.source,
        notes: l.notes,
        is_consignado: l.is_consignado,
        sort_order: i,
      })),
    );
    if (error) throw new Error(error.message);
  }

  if (bundle.netWorthGoal) {
    const { error } = await supabase.from("net_worth_goals").insert({
      user_id: userId,
      ...bundle.netWorthGoal,
    });
    if (error) throw new Error(error.message);
  }

  if (bundle.projections.length) {
    const { error } = await supabase.from("projection_months").insert(
      bundle.projections.map((p) => ({
        user_id: userId,
        year: p.year,
        month: p.month,
        commitments: p.commitments,
        income: p.income,
        notes: p.notes,
      })),
    );
    if (error) throw new Error(error.message);
  }

  if (bundle.alerts.length) {
    const { error } = await supabase.from("alerts").insert(
      bundle.alerts.map((a, i) => ({
        user_id: userId,
        severity: a.severity,
        title: a.title,
        message: a.message,
        sort_order: i,
      })),
    );
    if (error) throw new Error(error.message);
  }

  if (bundle.debtCandidates.length) {
    const { error } = await supabase.from("debt_candidates").insert(
      bundle.debtCandidates.map((c, i) => ({
        user_id: userId,
        name: c.name,
        cost_to_act: c.cost_to_act,
        cancels_amount: c.cancels_amount,
        interest_rate_month: c.interest_rate_month,
        installment_freed: c.installment_freed,
        is_risk_first: c.is_risk_first,
        sort_order: i,
      })),
    );
    if (error) throw new Error(error.message);
  }

  const { error: scenError } = await supabase.from("scenario_inputs").insert({
    user_id: userId,
    ...bundle.scenario,
  });
  if (scenError) throw new Error(scenError.message);
}
