-- APPFINANCAS — Controladoria Pessoal
-- Execute no SQL Editor do Supabase (pode substituir a migration anterior de transactions).

-- Limpa modelo antigo de "gastos / deixei de gastar" se existir
drop table if exists public.transactions cascade;
drop type if exists public.transaction_kind cascade;

-- Preferências do usuário (caixa livre, superávit, dia de referência)
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Renan',
  reference_day int not null default 1 check (reference_day between 1 and 31),
  caixa_livre numeric(14, 2) not null default 0,
  monthly_surplus numeric(14, 2) not null default 0,
  current_month int not null default 7 check (current_month between 1 and 12),
  current_year int not null default 2026,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Agenda / contas a pagar do mês
create table public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  due_day int not null check (due_day between 1 and 31),
  account_name text not null,
  amount numeric(14, 2) not null,
  paid boolean not null default false,
  category text not null default 'Geral',
  month int not null check (month between 1 and 12),
  year int not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agenda_items_user_month_idx on public.agenda_items (user_id, year, month, due_day);

-- Matriz multi-mês (Contas_Ago_Jan)
create table public.bill_matrix_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_name text not null,
  due_day int not null check (due_day between 1 and 31),
  source text not null default 'Fixos',
  paid boolean not null default false,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bill_matrix_amounts (
  id uuid primary key default gen_random_uuid(),
  row_id uuid not null references public.bill_matrix_rows (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  amount numeric(14, 2) not null default 0,
  unique (row_id, year, month)
);

-- Despesas fixas
create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_name text not null,
  category text not null,
  amount numeric(14, 2) not null,
  due_day int not null check (due_day between 1 and 31),
  bank text,
  until_when text,
  paid boolean not null default false,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Empréstimos com parcela
create table public.installment_loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bank text not null,
  balance numeric(14, 2) not null,
  installment numeric(14, 2) not null,
  remaining int,
  end_estimated text,
  status text not null default 'Em dia',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dívidas abertas / irregulares
create table public.open_debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bank text not null,
  total_balance numeric(14, 2) not null default 0,
  overdue numeric(14, 2) not null default 0,
  payoff_amount numeric(14, 2) not null default 0,
  priority int,
  status text not null default 'Em aberto',
  strategy text,
  interest_rate_month numeric(8, 4) default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cronograma Caixa PJ
create table public.loan_parcels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  debt_label text not null default 'Caixa PJ',
  parcel_index int not null,
  parcel_number int not null default 0,
  situation text not null default 'Não Paga',
  amount numeric(14, 2) not null,
  amount_with_interest numeric(14, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cartões
create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bank text not null,
  card_name text not null,
  limit_total numeric(14, 2) not null default 0,
  used_amount numeric(14, 2) not null default 0,
  close_day int,
  due_day int,
  current_bill numeric(14, 2) not null default 0,
  next_bill numeric(14, 2) not null default 0,
  remaining_installments numeric(14, 2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.card_schedules (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.credit_cards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  amount numeric(14, 2) not null default 0,
  unique (card_id, year, month)
);

-- Fluxo diário
create table public.cashflow_months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  opening_balance numeric(14, 2) not null default 0,
  caixa_livre numeric(14, 2) not null default 0,
  unique (user_id, year, month)
);

create table public.cashflow_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  day int not null check (day between 1 and 31),
  inflows numeric(14, 2) not null default 0,
  outflows numeric(14, 2) not null default 0,
  events text,
  unique (user_id, year, month, day)
);

-- Prioridades
create table public.priorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sort_order int not null default 0,
  debt_name text not null,
  action text not null,
  amount numeric(14, 2),
  status text not null default 'Em aberto',
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ativos / patrimônio
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  value numeric(14, 2) not null default 0,
  asset_type text not null default 'Outro',
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.liability_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  balance numeric(14, 2) not null default 0,
  source text,
  notes text,
  is_consignado boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.net_worth_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  home_target numeric(14, 2) not null default 0,
  credit_letter numeric(14, 2) not null default 0,
  down_payment_needed numeric(14, 2) not null default 0,
  down_payment_missing numeric(14, 2) not null default 0,
  estimated_deadline text,
  strategy text
);

-- Projeção mensal
create table public.projection_months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  commitments numeric(14, 2) not null default 0,
  income numeric(14, 2) not null default 0,
  notes text,
  unique (user_id, year, month)
);

-- Alertas do dashboard
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  severity text not null default 'info',
  title text not null,
  message text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Candidatos do simulador / cenários
create table public.debt_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  cost_to_act numeric(14, 2) not null default 0,
  cancels_amount numeric(14, 2) not null default 0,
  interest_rate_month numeric(8, 4) not null default 0,
  installment_freed numeric(14, 2) not null default 0,
  sort_order int not null default 0,
  is_risk_first boolean not null default false
);

create table public.scenario_inputs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  caixa_livre numeric(14, 2) not null default 0,
  extra_income numeric(14, 2) not null default 0,
  bonus numeric(14, 2) not null default 0,
  asset_sale numeric(14, 2) not null default 0,
  other_amount numeric(14, 2) not null default 0,
  monthly_surplus numeric(14, 2) not null default 0,
  simulator_received numeric(14, 2) not null default 0
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'user_settings','agenda_items','bill_matrix_rows','fixed_expenses',
    'installment_loans','open_debts','loan_parcels','credit_cards',
    'priorities','assets','liability_entries'
  ]
  loop
    execute format(
      'drop trigger if exists %I_set_updated_at on public.%I;
       create trigger %I_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();',
      t, t, t, t
    );
  end loop;
end $$;

-- RLS
alter table public.user_settings enable row level security;
alter table public.agenda_items enable row level security;
alter table public.bill_matrix_rows enable row level security;
alter table public.bill_matrix_amounts enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.installment_loans enable row level security;
alter table public.open_debts enable row level security;
alter table public.loan_parcels enable row level security;
alter table public.credit_cards enable row level security;
alter table public.card_schedules enable row level security;
alter table public.cashflow_months enable row level security;
alter table public.cashflow_days enable row level security;
alter table public.priorities enable row level security;
alter table public.assets enable row level security;
alter table public.liability_entries enable row level security;
alter table public.net_worth_goals enable row level security;
alter table public.projection_months enable row level security;
alter table public.alerts enable row level security;
alter table public.debt_candidates enable row level security;
alter table public.scenario_inputs enable row level security;

-- Políticas genéricas: dono = auth.uid()
do $$
declare
  t text;
begin
  foreach t in array array[
    'user_settings','agenda_items','bill_matrix_rows','bill_matrix_amounts',
    'fixed_expenses','installment_loans','open_debts','loan_parcels',
    'credit_cards','card_schedules','cashflow_months','cashflow_days',
    'priorities','assets','liability_entries','net_worth_goals',
    'projection_months','alerts','debt_candidates','scenario_inputs'
  ]
  loop
    execute format('drop policy if exists "select own" on public.%I', t);
    execute format('drop policy if exists "insert own" on public.%I', t);
    execute format('drop policy if exists "update own" on public.%I', t);
    execute format('drop policy if exists "delete own" on public.%I', t);

    execute format(
      'create policy "select own" on public.%I for select to authenticated using (auth.uid() = user_id)',
      t
    );
    execute format(
      'create policy "insert own" on public.%I for insert to authenticated with check (auth.uid() = user_id)',
      t
    );
    execute format(
      'create policy "update own" on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
    execute format(
      'create policy "delete own" on public.%I for delete to authenticated using (auth.uid() = user_id)',
      t
    );
  end loop;
end $$;
