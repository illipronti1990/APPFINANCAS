"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import type { TransactionKind } from "@/lib/types";

function revalidateApp() {
  revalidatePath("/dashboard");
  revalidatePath("/transacoes");
  revalidatePath("/categorias");
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Não foi possível entrar. Verifique e-mail e senha." };
  }

  redirect("/dashboard");
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
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message || "Não foi possível criar a conta." };
  }

  return {
    success:
      "Conta criada. Se o projeto exigir confirmação, verifique seu e-mail. Depois, faça login.",
  };
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const { siteUrl } = getSupabaseEnv();

  if (!email) {
    return { error: "Informe seu e-mail." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: "Não foi possível enviar o link. Tente novamente." };
  }

  return {
    success: "Enviamos um link mágico para seu e-mail. Abra-o neste dispositivo.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createTransaction(formData: FormData) {
  const kind = String(formData.get("kind") ?? "") as TransactionKind;
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const occurredOn = String(formData.get("occurred_on") ?? "").trim();

  if (kind !== "gasto" && kind !== "deixei_de_gastar") {
    return { error: "Tipo de lançamento inválido." };
  }

  const amount = Number(amountRaw.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Informe um valor maior que zero." };
  }

  if (!category) {
    return { error: "Informe a categoria." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) {
    return { error: "Informe uma data válida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    kind,
    amount,
    category,
    note: note || null,
    occurred_on: occurredOn,
  });

  if (error) {
    return {
      error:
        "Não foi possível salvar. Confira se a tabela transactions existe no Supabase.",
    };
  }

  revalidateApp();
  redirect("/transacoes");
}

export async function updateTransaction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "") as TransactionKind;
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const occurredOn = String(formData.get("occurred_on") ?? "").trim();

  if (!id) {
    return { error: "Lançamento não encontrado." };
  }

  if (kind !== "gasto" && kind !== "deixei_de_gastar") {
    return { error: "Tipo de lançamento inválido." };
  }

  const amount = Number(amountRaw.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Informe um valor maior que zero." };
  }

  if (!category) {
    return { error: "Informe a categoria." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) {
    return { error: "Informe uma data válida." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      kind,
      amount,
      category,
      note: note || null,
      occurred_on: occurredOn,
    })
    .eq("id", id);

  if (error) {
    return { error: "Não foi possível atualizar o lançamento." };
  }

  revalidateApp();
  redirect("/transacoes");
}

export async function deleteTransaction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Lançamento não encontrado." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) {
    return { error: "Não foi possível excluir o lançamento." };
  }

  revalidateApp();
  redirect("/transacoes");
}
