-- APPFINANCAS — schema inicial
-- Execute no SQL Editor do Supabase (Dashboard → SQL → New query)

-- Tipos de lançamento
create type public.transaction_kind as enum ('gasto', 'deixei_de_gastar');

-- Lançamentos financeiros por usuário
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind public.transaction_kind not null,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null check (char_length(trim(category)) > 0),
  note text,
  occurred_on date not null default (timezone('America/Sao_Paulo', now()))::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_id_idx on public.transactions (user_id);
create index transactions_user_occurred_idx on public.transactions (user_id, occurred_on desc);
create index transactions_user_kind_idx on public.transactions (user_id, kind);

-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_set_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

-- Row Level Security: cada usuário só vê e altera os próprios dados
alter table public.transactions enable row level security;

create policy "Usuários leem próprios lançamentos"
  on public.transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuários criam próprios lançamentos"
  on public.transactions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuários atualizam próprios lançamentos"
  on public.transactions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuários excluem próprios lançamentos"
  on public.transactions
  for delete
  to authenticated
  using (auth.uid() = user_id);
