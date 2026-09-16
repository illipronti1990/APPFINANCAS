export type TransactionKind = "gasto" | "deixei_de_gastar";

export type Transaction = {
  id: string;
  user_id: string;
  kind: TransactionKind;
  amount: number;
  category: string;
  note: string | null;
  occurred_on: string;
  created_at: string;
  updated_at: string;
};

export type TransactionInput = {
  kind: TransactionKind;
  amount: number;
  category: string;
  note?: string | null;
  occurred_on: string;
};

export const GASTO_CATEGORIES = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Lazer",
  "Educação",
  "Compras",
  "Contas",
  "Outros",
] as const;

export const EVITEI_CATEGORIES = [
  "Evitei compra por impulso",
  "Optei por opção mais barata",
  "Cancelei assinatura",
  "Fiz em casa",
  "Desconto aproveitado",
  "Outros",
] as const;

export function categoriesForKind(kind: TransactionKind): readonly string[] {
  return kind === "gasto" ? GASTO_CATEGORIES : EVITEI_CATEGORIES;
}

export function kindLabel(kind: TransactionKind): string {
  return kind === "gasto" ? "Gasto" : "Deixei de gastar";
}
