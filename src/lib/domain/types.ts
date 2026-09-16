export type UserSettings = {
  display_name: string;
  reference_day: number;
  caixa_livre: number;
  monthly_surplus: number;
  current_month: number;
  current_year: number;
};

export type AgendaItem = {
  id: string;
  due_day: number;
  account_name: string;
  amount: number;
  paid: boolean;
  category: string;
  month: number;
  year: number;
  notes?: string | null;
};

export type BillMatrixRow = {
  id: string;
  account_name: string;
  due_day: number;
  source: string;
  paid: boolean;
  notes?: string | null;
  amounts: { year: number; month: number; amount: number }[];
};

export type FixedExpense = {
  id: string;
  account_name: string;
  category: string;
  amount: number;
  due_day: number;
  bank?: string | null;
  until_when?: string | null;
  paid: boolean;
  notes?: string | null;
};

export type InstallmentLoan = {
  id: string;
  bank: string;
  balance: number;
  installment: number;
  remaining: number | null;
  end_estimated?: string | null;
  status: string;
};

export type OpenDebt = {
  id: string;
  bank: string;
  total_balance: number;
  overdue: number;
  payoff_amount: number;
  priority: number | null;
  status: string;
  strategy?: string | null;
  interest_rate_month?: number;
};

export type LoanParcel = {
  id: string;
  debt_label: string;
  parcel_index: number;
  parcel_number: number;
  situation: string;
  amount: number;
  amount_with_interest: number;
};

export type CreditCard = {
  id: string;
  bank: string;
  card_name: string;
  limit_total: number;
  used_amount: number;
  close_day?: number | null;
  due_day?: number | null;
  current_bill: number;
  next_bill: number;
  remaining_installments: number;
  schedule: { year: number; month: number; amount: number }[];
};

export type CashflowDay = {
  id: string;
  year: number;
  month: number;
  day: number;
  inflows: number;
  outflows: number;
  events?: string | null;
};

export type CashflowMonth = {
  year: number;
  month: number;
  opening_balance: number;
  caixa_livre: number;
  days: CashflowDay[];
};

export type Priority = {
  id: string;
  sort_order: number;
  debt_name: string;
  action: string;
  amount: number | null;
  status: string;
  reason?: string | null;
};

export type Asset = {
  id: string;
  name: string;
  value: number;
  asset_type: string;
  notes?: string | null;
};

export type LiabilityEntry = {
  id: string;
  name: string;
  balance: number;
  source?: string | null;
  notes?: string | null;
  is_consignado: boolean;
};

export type NetWorthGoal = {
  home_target: number;
  credit_letter: number;
  down_payment_needed: number;
  down_payment_missing: number;
  estimated_deadline?: string | null;
  strategy?: string | null;
};

export type ProjectionMonth = {
  year: number;
  month: number;
  commitments: number;
  income: number;
  notes?: string | null;
};

export type Alert = {
  id: string;
  severity: string;
  title: string;
  message: string;
};

export type DebtCandidate = {
  id: string;
  name: string;
  cost_to_act: number;
  cancels_amount: number;
  interest_rate_month: number;
  installment_freed: number;
  is_risk_first: boolean;
};

export type ScenarioInputs = {
  caixa_livre: number;
  extra_income: number;
  bonus: number;
  asset_sale: number;
  other_amount: number;
  monthly_surplus: number;
  simulator_received: number;
};

export type ControladoriaBundle = {
  settings: UserSettings;
  agenda: AgendaItem[];
  billMatrix: BillMatrixRow[];
  fixedExpenses: FixedExpense[];
  installmentLoans: InstallmentLoan[];
  openDebts: OpenDebt[];
  loanParcels: LoanParcel[];
  cards: CreditCard[];
  cashflow: CashflowMonth | null;
  priorities: Priority[];
  assets: Asset[];
  liabilities: LiabilityEntry[];
  netWorthGoal: NetWorthGoal | null;
  projections: ProjectionMonth[];
  alerts: Alert[];
  debtCandidates: DebtCandidate[];
  scenario: ScenarioInputs;
};

export function emptyBundle(): ControladoriaBundle {
  return {
    settings: {
      display_name: "Renan",
      reference_day: new Date().getDate(),
      caixa_livre: 0,
      monthly_surplus: 0,
      current_month: new Date().getMonth() + 1,
      current_year: new Date().getFullYear(),
    },
    agenda: [],
    billMatrix: [],
    fixedExpenses: [],
    installmentLoans: [],
    openDebts: [],
    loanParcels: [],
    cards: [],
    cashflow: null,
    priorities: [],
    assets: [],
    liabilities: [],
    netWorthGoal: null,
    projections: [],
    alerts: [],
    debtCandidates: [],
    scenario: {
      caixa_livre: 0,
      extra_income: 0,
      bonus: 0,
      asset_sale: 0,
      other_amount: 0,
      monthly_surplus: 0,
      simulator_received: 0,
    },
  };
}
