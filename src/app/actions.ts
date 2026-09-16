"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { replaceUserBundle } from "@/lib/data/persist";
import { parseWorkbook, parseWorkbookFromFile } from "@/lib/import/excel";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import path from "path";

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

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Não foi possível entrar. Verifique e-mail e senha." };
  redirect("/inicio");
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { siteUrl } = getSupabaseEnv();
  if (!email || password.length < 6) {
    return { error: "Use um e-mail válido e senha com pelo menos 6 caracteres." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });
  if (error) return { error: error.message || "Não foi possível criar a conta." };
  return {
    success:
      "Conta criada. Se o projeto exigir confirmação, verifique seu e-mail. Depois, faça login e importe a planilha.",
  };
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const { siteUrl } = getSupabaseEnv();
  if (!email) return { error: "Informe seu e-mail." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });
  if (error) return { error: "Não foi possível enviar o link. Tente novamente." };
  return {
    success: "Enviamos um link mágico para seu e-mail. Abra-o neste dispositivo.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function toggleAgendaPaid(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const paid = String(formData.get("paid") ?? "") === "true";
  if (!id || process.env.APP_UI_PREVIEW === "1") return;
  const supabase = await createClient();
  await supabase.from("agenda_items").update({ paid: !paid }).eq("id", id);
  revalidateAll();
}

export async function toggleFixedPaid(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const paid = String(formData.get("paid") ?? "") === "true";
  if (!id || process.env.APP_UI_PREVIEW === "1") return;
  const supabase = await createClient();
  await supabase.from("fixed_expenses").update({ paid: !paid }).eq("id", id);
  revalidateAll();
}

export async function markParcelPaid(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id || process.env.APP_UI_PREVIEW === "1") return;
  const supabase = await createClient();
  await supabase
    .from("loan_parcels")
    .update({ situation: "Pago" })
    .eq("id", id);
  revalidateAll();
}

export async function updateCardUsed(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const used = Number(String(formData.get("used") ?? "").replace(",", "."));
  if (!id || !Number.isFinite(used) || used < 0) return;
  if (process.env.APP_UI_PREVIEW === "1") return;
  const supabase = await createClient();
  await supabase.from("credit_cards").update({ used_amount: used }).eq("id", id);
  revalidateAll();
}

export async function updateScenarioInputs(formData: FormData) {
  const fields = {
    caixa_livre: Number(String(formData.get("caixa_livre") ?? "0").replace(",", ".")),
    extra_income: Number(String(formData.get("extra_income") ?? "0").replace(",", ".")),
    bonus: Number(String(formData.get("bonus") ?? "0").replace(",", ".")),
    asset_sale: Number(String(formData.get("asset_sale") ?? "0").replace(",", ".")),
    other_amount: Number(String(formData.get("other_amount") ?? "0").replace(",", ".")),
    monthly_surplus: Number(
      String(formData.get("monthly_surplus") ?? "0").replace(",", "."),
    ),
    simulator_received: Number(
      String(formData.get("simulator_received") ?? "0").replace(",", "."),
    ),
  };
  if (process.env.APP_UI_PREVIEW === "1") {
    return { success: "Pré-visualização: cenário calculado só na tela." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };
  const { error } = await supabase.from("scenario_inputs").upsert({
    user_id: user.id,
    ...fields,
  });
  if (error) return { error: "Não foi possível salvar o cenário." };
  revalidateAll();
  return { success: "Cenário atualizado." };
}

export async function updateReferenceDay(formData: FormData) {
  const day = Number(formData.get("reference_day"));
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    return { error: "Dia inválido." };
  }
  if (process.env.APP_UI_PREVIEW === "1") {
    return { success: "Pré-visualização: dia de referência não persistido." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, reference_day: day }, { onConflict: "user_id" });
  if (error) return { error: "Não foi possível salvar." };
  revalidateAll();
  return { success: "Dia de referência atualizado." };
}

export async function importModeloPlanilha() {
  if (process.env.APP_UI_PREVIEW === "1") {
    return { success: "Em pré-visualização os dados já vêm da planilha modelo." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Faça login para importar." };
  try {
    const file = path.join(process.cwd(), "data", "planilha-modelo.xlsx");
    const bundle = await parseWorkbookFromFile(file);
    await replaceUserBundle(user.id, bundle);
    revalidateAll();
    return { success: "Planilha modelo importada com sucesso." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Falha ao importar a planilha.",
    };
  }
}

export async function importUploadedPlanilha(formData: FormData) {
  if (process.env.APP_UI_PREVIEW === "1") {
    return { error: "Importação de arquivo desativada na pré-visualização." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo .xlsx." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Faça login para importar." };
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const bundle = parseWorkbook(buffer);
    await replaceUserBundle(user.id, bundle);
    revalidateAll();
    return { success: "Planilha importada. Seus dados na nuvem foram atualizados." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Falha ao importar a planilha.",
    };
  }
}
