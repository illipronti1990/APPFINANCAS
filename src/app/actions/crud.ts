"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateAll() {
  for (const p of [
    "/inicio",
    "/dashboard",
    "/agenda",
    "/contas",
    "/fluxo",
    "/fixos",
    "/emprestimos",
    "/cartoes",
    "/cenarios",
    "/simulador",
    "/prioridades",
    "/patrimonio",
    "/projecao",
    "/importar",
  ]) {
    revalidatePath(p);
  }
}

async function requireUser() {
  if (process.env.APP_UI_PREVIEW === "1") {
    return { preview: true as const, userId: null as string | null };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { preview: false as const, userId: null as string | null, error: "Sessão expirada. Faça login." };
  return { preview: false as const, userId: user.id, supabase };
}

function num(formData: FormData, key: string): number {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return NaN;
  // Aceita 1234.56 ou 1.234,56
  let s = raw.replace(/R\$\s?/gi, "").replace(/\s/g, "");
  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function bool(formData: FormData, key: string): boolean {
  const v = String(formData.get(key) ?? "");
  return v === "on" || v === "true" || v === "S" || v === "1";
}

function previewMsg() {
  return {
    success:
      "Pré-visualização: formulário ok, mas alterações não são gravadas. Configure o Supabase para persistir.",
  };
}

// ——— Agenda ———

export async function upsertAgendaItem(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();

  const id = str(formData, "id");
  const due_day = Number(str(formData, "due_day"));
  const account_name = str(formData, "account_name");
  const amount = num(formData, "amount");
  const category = str(formData, "category") || "Geral";
  const month = Number(str(formData, "month"));
  const year = Number(str(formData, "year"));
  const paid = bool(formData, "paid");
  const notes = str(formData, "notes") || null;

  if (!account_name || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Informe conta e valor válido." };
  }
  if (!due_day || due_day < 1 || due_day > 31) {
    return { error: "Dia de vencimento inválido (1–31)." };
  }

  const row = {
    due_day,
    account_name,
    amount,
    category,
    month,
    year,
    paid,
    notes,
  };

  if (id) {
    const { error } = await auth.supabase!
      .from("agenda_items")
      .update(row)
      .eq("id", id)
      .eq("user_id", auth.userId!);
    if (error) return { error: "Não foi possível atualizar o item." };
  } else {
    const { error } = await auth.supabase!.from("agenda_items").insert({
      user_id: auth.userId!,
      ...row,
    });
    if (error) return { error: "Não foi possível adicionar o item." };
  }
  revalidateAll();
  return { success: id ? "Item atualizado." : "Item adicionado." };
}

export async function deleteAgendaItem(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();
  const id = str(formData, "id");
  if (!id) return { error: "Item inválido." };
  const { error } = await auth.supabase!
    .from("agenda_items")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId!);
  if (error) return { error: "Não foi possível excluir." };
  revalidateAll();
  return { success: "Item excluído." };
}

// ——— Fixos ———

export async function upsertFixedExpense(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();

  const id = str(formData, "id");
  const account_name = str(formData, "account_name");
  const category = str(formData, "category") || "Geral";
  const amount = num(formData, "amount");
  const due_day = Number(str(formData, "due_day"));
  const bank = str(formData, "bank") || null;
  const until_when = str(formData, "until_when") || null;
  const paid = bool(formData, "paid");
  const notes = str(formData, "notes") || null;

  if (!account_name || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Informe conta e valor válido." };
  }
  if (!due_day || due_day < 1 || due_day > 31) {
    return { error: "Dia inválido." };
  }

  const row = { account_name, category, amount, due_day, bank, until_when, paid, notes };
  if (id) {
    const { error } = await auth.supabase!
      .from("fixed_expenses")
      .update(row)
      .eq("id", id)
      .eq("user_id", auth.userId!);
    if (error) return { error: "Não foi possível atualizar." };
  } else {
    const { error } = await auth.supabase!.from("fixed_expenses").insert({
      user_id: auth.userId!,
      ...row,
    });
    if (error) return { error: "Não foi possível adicionar." };
  }
  revalidateAll();
  return { success: id ? "Fixo atualizado." : "Fixo adicionado." };
}

export async function deleteFixedExpense(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();
  const id = str(formData, "id");
  if (!id) return { error: "Item inválido." };
  const { error } = await auth.supabase!
    .from("fixed_expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId!);
  if (error) return { error: "Não foi possível excluir." };
  revalidateAll();
  return { success: "Fixo excluído." };
}

// ——— Empréstimos ———

export async function upsertInstallmentLoan(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();

  const id = str(formData, "id");
  const bank = str(formData, "bank");
  const balance = num(formData, "balance");
  const installment = num(formData, "installment");
  const remainingRaw = str(formData, "remaining");
  const remaining = remainingRaw ? Number(remainingRaw) : null;
  const end_estimated = str(formData, "end_estimated") || null;
  const status = str(formData, "status") || "Em dia";

  if (!bank || !Number.isFinite(balance) || balance < 0) {
    return { error: "Informe banco e saldo." };
  }
  if (!Number.isFinite(installment) || installment < 0) {
    return { error: "Informe a parcela." };
  }

  const row = { bank, balance, installment, remaining, end_estimated, status };
  if (id) {
    const { error } = await auth.supabase!
      .from("installment_loans")
      .update(row)
      .eq("id", id)
      .eq("user_id", auth.userId!);
    if (error) return { error: "Não foi possível atualizar." };
  } else {
    const { error } = await auth.supabase!.from("installment_loans").insert({
      user_id: auth.userId!,
      ...row,
    });
    if (error) return { error: "Não foi possível adicionar." };
  }
  revalidateAll();
  return { success: id ? "Empréstimo atualizado." : "Empréstimo adicionado." };
}

export async function deleteInstallmentLoan(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();
  const id = str(formData, "id");
  if (!id) return { error: "Item inválido." };
  const { error } = await auth.supabase!
    .from("installment_loans")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId!);
  if (error) return { error: "Não foi possível excluir." };
  revalidateAll();
  return { success: "Empréstimo excluído." };
}

export async function upsertOpenDebt(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();

  const id = str(formData, "id");
  const bank = str(formData, "bank");
  const total_balance = num(formData, "total_balance");
  const overdue = num(formData, "overdue") || 0;
  const payoff_amount = num(formData, "payoff_amount") || 0;
  const priorityRaw = str(formData, "priority");
  const priority = priorityRaw ? Number(priorityRaw) : null;
  const status = str(formData, "status") || "Em aberto";
  const strategy = str(formData, "strategy") || null;
  const interest_rate_month = num(formData, "interest_rate_month") || 0;

  if (!bank || !Number.isFinite(total_balance)) {
    return { error: "Informe banco e saldo." };
  }

  const row = {
    bank,
    total_balance,
    overdue,
    payoff_amount,
    priority,
    status,
    strategy,
    interest_rate_month,
  };
  if (id) {
    const { error } = await auth.supabase!
      .from("open_debts")
      .update(row)
      .eq("id", id)
      .eq("user_id", auth.userId!);
    if (error) return { error: "Não foi possível atualizar." };
  } else {
    const { error } = await auth.supabase!.from("open_debts").insert({
      user_id: auth.userId!,
      ...row,
    });
    if (error) return { error: "Não foi possível adicionar." };
  }
  revalidateAll();
  return { success: id ? "Dívida atualizada." : "Dívida adicionada." };
}

export async function deleteOpenDebt(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();
  const id = str(formData, "id");
  if (!id) return { error: "Item inválido." };
  const { error } = await auth.supabase!
    .from("open_debts")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId!);
  if (error) return { error: "Não foi possível excluir." };
  revalidateAll();
  return { success: "Dívida excluída." };
}

export async function upsertLoanParcel(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();

  const id = str(formData, "id");
  const parcel_index = Number(str(formData, "parcel_index"));
  const parcel_number = Number(str(formData, "parcel_number") || "0");
  const situation = str(formData, "situation") || "Não Paga";
  const amount = num(formData, "amount");
  const amount_with_interest = num(formData, "amount_with_interest");
  const debt_label = str(formData, "debt_label") || "Caixa PJ";

  if (!parcel_index || !Number.isFinite(amount)) {
    return { error: "Informe índice e valor da parcela." };
  }

  const row = {
    debt_label,
    parcel_index,
    parcel_number,
    situation,
    amount,
    amount_with_interest: Number.isFinite(amount_with_interest)
      ? amount_with_interest
      : amount,
  };
  if (id) {
    const { error } = await auth.supabase!
      .from("loan_parcels")
      .update(row)
      .eq("id", id)
      .eq("user_id", auth.userId!);
    if (error) return { error: "Não foi possível atualizar." };
  } else {
    const { error } = await auth.supabase!.from("loan_parcels").insert({
      user_id: auth.userId!,
      ...row,
    });
    if (error) return { error: "Não foi possível adicionar." };
  }
  revalidateAll();
  return { success: id ? "Parcela atualizada." : "Parcela adicionada." };
}

export async function deleteLoanParcel(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();
  const id = str(formData, "id");
  if (!id) return { error: "Item inválido." };
  const { error } = await auth.supabase!
    .from("loan_parcels")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId!);
  if (error) return { error: "Não foi possível excluir." };
  revalidateAll();
  return { success: "Parcela excluída." };
}

// ——— Cartões ———

export async function upsertCreditCard(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();

  const id = str(formData, "id");
  const bank = str(formData, "bank");
  const card_name = str(formData, "card_name");
  const limit_total = num(formData, "limit_total");
  const used_amount = num(formData, "used_amount") || 0;
  const close_day = Number(str(formData, "close_day") || "0") || null;
  const due_day = Number(str(formData, "due_day") || "0") || null;
  const current_bill = num(formData, "current_bill") || 0;
  const next_bill = num(formData, "next_bill") || 0;
  const remaining_installments = num(formData, "remaining_installments") || 0;

  if (!bank || !card_name || !Number.isFinite(limit_total) || limit_total < 0) {
    return { error: "Informe banco, cartão e limite." };
  }

  const row = {
    bank,
    card_name,
    limit_total,
    used_amount,
    close_day,
    due_day,
    current_bill,
    next_bill,
    remaining_installments,
  };
  if (id) {
    const { error } = await auth.supabase!
      .from("credit_cards")
      .update(row)
      .eq("id", id)
      .eq("user_id", auth.userId!);
    if (error) return { error: "Não foi possível atualizar o cartão." };
  } else {
    const { error } = await auth.supabase!.from("credit_cards").insert({
      user_id: auth.userId!,
      ...row,
    });
    if (error) return { error: "Não foi possível adicionar o cartão." };
  }
  revalidateAll();
  return { success: id ? "Cartão atualizado." : "Cartão adicionado." };
}

export async function deleteCreditCard(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();
  const id = str(formData, "id");
  if (!id) return { error: "Item inválido." };
  await auth.supabase!
    .from("card_schedules")
    .delete()
    .eq("card_id", id)
    .eq("user_id", auth.userId!);
  const { error } = await auth.supabase!
    .from("credit_cards")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId!);
  if (error) return { error: "Não foi possível excluir." };
  revalidateAll();
  return { success: "Cartão excluído." };
}

// ——— Contas (matriz) ———

export async function upsertBillMatrixRow(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();

  const id = str(formData, "id");
  const account_name = str(formData, "account_name");
  const due_day = Number(str(formData, "due_day"));
  const source = str(formData, "source") || "Fixos";
  const paid = bool(formData, "paid");
  const notes = str(formData, "notes") || null;

  if (!account_name || !due_day) {
    return { error: "Informe conta e dia." };
  }

  let rowId = id;
  if (id) {
    const { error } = await auth.supabase!
      .from("bill_matrix_rows")
      .update({ account_name, due_day, source, paid, notes })
      .eq("id", id)
      .eq("user_id", auth.userId!);
    if (error) return { error: "Não foi possível atualizar a linha." };
  } else {
    const { data, error } = await auth.supabase!
      .from("bill_matrix_rows")
      .insert({
        user_id: auth.userId!,
        account_name,
        due_day,
        source,
        paid,
        notes,
      })
      .select("id")
      .single();
    if (error || !data) return { error: "Não foi possível adicionar a linha." };
    rowId = data.id;
  }

  // Optional month amounts: amount_YYYY_MM
  const amountEntries: { year: number; month: number; amount: number }[] = [];
  for (const [key] of formData.entries()) {
    const m = /^amount_(\d{4})_(\d{1,2})$/.exec(key);
    if (!m) continue;
    const amount = num(formData, key);
    if (!Number.isFinite(amount)) continue;
    amountEntries.push({
      year: Number(m[1]),
      month: Number(m[2]),
      amount,
    });
  }

  for (const a of amountEntries) {
    const { error } = await auth.supabase!.from("bill_matrix_amounts").upsert(
      {
        row_id: rowId,
        user_id: auth.userId!,
        year: a.year,
        month: a.month,
        amount: a.amount,
      },
      { onConflict: "row_id,year,month" },
    );
    if (error) return { error: "Linha salva, mas falhou ao gravar valores mensais." };
  }

  revalidateAll();
  return { success: id ? "Linha atualizada." : "Linha adicionada." };
}

export async function deleteBillMatrixRow(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();
  const id = str(formData, "id");
  if (!id) return { error: "Item inválido." };
  await auth.supabase!
    .from("bill_matrix_amounts")
    .delete()
    .eq("row_id", id)
    .eq("user_id", auth.userId!);
  const { error } = await auth.supabase!
    .from("bill_matrix_rows")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId!);
  if (error) return { error: "Não foi possível excluir." };
  revalidateAll();
  return { success: "Linha excluída." };
}

// ——— Fluxo ———

export async function updateCashflowOpening(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();

  const year = Number(str(formData, "year"));
  const month = Number(str(formData, "month"));
  const opening_balance = num(formData, "opening_balance");
  const caixa_livre = num(formData, "caixa_livre");

  if (!year || !month || !Number.isFinite(opening_balance)) {
    return { error: "Informe mês/ano e saldo inicial." };
  }

  const { error } = await auth.supabase!.from("cashflow_months").upsert(
    {
      user_id: auth.userId!,
      year,
      month,
      opening_balance,
      caixa_livre: Number.isFinite(caixa_livre) ? caixa_livre : 0,
    },
    { onConflict: "user_id,year,month" },
  );
  if (error) return { error: "Não foi possível salvar o saldo inicial." };
  revalidateAll();
  return { success: "Saldo inicial atualizado." };
}

export async function upsertCashflowDay(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();

  const id = str(formData, "id");
  const year = Number(str(formData, "year"));
  const month = Number(str(formData, "month"));
  const day = Number(str(formData, "day"));
  const inflows = num(formData, "inflows") || 0;
  const outflows = num(formData, "outflows") || 0;
  const events = str(formData, "events") || null;

  if (!year || !month || !day || day < 1 || day > 31) {
    return { error: "Informe um dia válido." };
  }

  // Ensure month exists
  await auth.supabase!.from("cashflow_months").upsert(
    {
      user_id: auth.userId!,
      year,
      month,
      opening_balance: 0,
      caixa_livre: 0,
    },
    { onConflict: "user_id,year,month" },
  );

  if (id) {
    const { error } = await auth.supabase!
      .from("cashflow_days")
      .update({ inflows, outflows, events, day })
      .eq("id", id)
      .eq("user_id", auth.userId!);
    if (error) return { error: "Não foi possível atualizar o dia." };
  } else {
    const { error } = await auth.supabase!.from("cashflow_days").upsert(
      {
        user_id: auth.userId!,
        year,
        month,
        day,
        inflows,
        outflows,
        events,
      },
      { onConflict: "user_id,year,month,day" },
    );
    if (error) return { error: "Não foi possível salvar o dia." };
  }
  revalidateAll();
  return { success: "Dia do fluxo salvo." };
}

export async function deleteCashflowDay(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();
  const id = str(formData, "id");
  if (!id) return { error: "Item inválido." };
  const { error } = await auth.supabase!
    .from("cashflow_days")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId!);
  if (error) return { error: "Não foi possível excluir." };
  revalidateAll();
  return { success: "Dia excluído." };
}

/** Regenera saídas do fluxo a partir da Agenda do mês (mantém entradas e saldo inicial). */
export async function regenerateCashflowFromAgenda(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();

  const year = Number(str(formData, "year"));
  const month = Number(str(formData, "month"));
  if (!year || !month) return { error: "Mês/ano inválidos." };

  const { data: agenda } = await auth.supabase!
    .from("agenda_items")
    .select("*")
    .eq("user_id", auth.userId!)
    .eq("year", year)
    .eq("month", month);

  const byDay = new Map<number, { outflows: number; events: string[] }>();
  for (const item of agenda ?? []) {
    const cur = byDay.get(item.due_day) ?? { outflows: 0, events: [] };
    cur.outflows += Number(item.amount);
    cur.events.push(`${item.paid ? "✓" : "○"} ${item.account_name}`);
    byDay.set(item.due_day, cur);
  }

  const { data: existing } = await auth.supabase!
    .from("cashflow_days")
    .select("*")
    .eq("user_id", auth.userId!)
    .eq("year", year)
    .eq("month", month);

  const inflowMap = new Map<number, { inflows: number; events: string }>();
  for (const d of existing ?? []) {
    if (Number(d.inflows) > 0) {
      inflowMap.set(d.day, {
        inflows: Number(d.inflows),
        events: String(d.events ?? ""),
      });
    }
  }

  await auth.supabase!
    .from("cashflow_days")
    .delete()
    .eq("user_id", auth.userId!)
    .eq("year", year)
    .eq("month", month);

  await auth.supabase!.from("cashflow_months").upsert(
    {
      user_id: auth.userId!,
      year,
      month,
      opening_balance: 0,
      caixa_livre: 0,
    },
    { onConflict: "user_id,year,month" },
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const rows = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const out = byDay.get(day);
    const inn = inflowMap.get(day);
    const eventParts = [
      ...(inn?.events ? [inn.events] : []),
      ...(out?.events ?? []),
    ].filter(Boolean);
    rows.push({
      user_id: auth.userId!,
      year,
      month,
      day,
      inflows: inn?.inflows ?? 0,
      outflows: out?.outflows ?? 0,
      events: eventParts.join(" | ") || null,
    });
  }

  const { error } = await auth.supabase!.from("cashflow_days").insert(rows);
  if (error) return { error: "Falha ao regenerar o fluxo." };
  revalidateAll();
  return {
    success:
      "Fluxo regenerado: saídas da Agenda aplicadas; entradas existentes preservadas. Ajuste o saldo inicial se precisar.",
  };
}

// ——— Patrimônio ———

export async function upsertAsset(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();

  const id = str(formData, "id");
  const name = str(formData, "name");
  const value = num(formData, "value");
  const asset_type = str(formData, "asset_type") || "Outro";
  const notes = str(formData, "notes") || null;

  if (!name || !Number.isFinite(value)) {
    return { error: "Informe nome e valor." };
  }

  if (id) {
    const { error } = await auth.supabase!
      .from("assets")
      .update({ name, value, asset_type, notes })
      .eq("id", id)
      .eq("user_id", auth.userId!);
    if (error) return { error: "Não foi possível atualizar." };
  } else {
    const { error } = await auth.supabase!.from("assets").insert({
      user_id: auth.userId!,
      name,
      value,
      asset_type,
      notes,
    });
    if (error) return { error: "Não foi possível adicionar." };
  }
  revalidateAll();
  return { success: id ? "Ativo atualizado." : "Ativo adicionado." };
}

export async function deleteAsset(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();
  const id = str(formData, "id");
  if (!id) return { error: "Item inválido." };
  const { error } = await auth.supabase!
    .from("assets")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId!);
  if (error) return { error: "Não foi possível excluir." };
  revalidateAll();
  return { success: "Ativo excluído." };
}

export async function upsertLiability(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();

  const id = str(formData, "id");
  const name = str(formData, "name");
  const balance = num(formData, "balance");
  const source = str(formData, "source") || null;
  const notes = str(formData, "notes") || null;
  const is_consignado = bool(formData, "is_consignado");

  if (!name || !Number.isFinite(balance)) {
    return { error: "Informe nome e saldo." };
  }

  if (id) {
    const { error } = await auth.supabase!
      .from("liability_entries")
      .update({ name, balance, source, notes, is_consignado })
      .eq("id", id)
      .eq("user_id", auth.userId!);
    if (error) return { error: "Não foi possível atualizar." };
  } else {
    const { error } = await auth.supabase!.from("liability_entries").insert({
      user_id: auth.userId!,
      name,
      balance,
      source,
      notes,
      is_consignado,
    });
    if (error) return { error: "Não foi possível adicionar." };
  }
  revalidateAll();
  return { success: id ? "Passivo atualizado." : "Passivo adicionado." };
}

export async function deleteLiability(formData: FormData) {
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) return previewMsg();
  const id = str(formData, "id");
  if (!id) return { error: "Item inválido." };
  const { error } = await auth.supabase!
    .from("liability_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId!);
  if (error) return { error: "Não foi possível excluir." };
  revalidateAll();
  return { success: "Passivo excluído." };
}

// ——— Wipe ———

async function wipeTables(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
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
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error) throw new Error(`Falha ao limpar ${table}.`);
  }
}

export async function wipeAllUserData(formData: FormData) {
  const confirm = str(formData, "confirm");
  if (confirm !== "APAGAR") {
    return { error: "Digite APAGAR para confirmar a exclusão de todos os dados." };
  }
  const auth = await requireUser();
  if (auth.error) return { error: auth.error };
  if (auth.preview) {
    return { error: "Pré-visualização: não há dados na nuvem para apagar." };
  }

  try {
    await wipeTables(auth.supabase!, auth.userId!);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao apagar dados." };
  }
  revalidateAll();
  return {
    success:
      "Todos os seus dados foram apagados. Você pode importar a planilha de novo.",
  };
}
