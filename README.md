# APPFINANCAS — Controladoria Pessoal

Aplicativo web de **controladoria financeira pessoal** do **Renan Illipronti**, modelado na planilha Excel (Inicio, Dashboard, Agenda, Contas, Fluxo, Fixos, Empréstimos, Cartões, Cenários, Simulador, Prioridades, Patrimônio, Projeção).

Interface em **português (Brasil)**. Conta na nuvem com **Supabase** (Auth + Postgres + RLS).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase Auth (e-mail/senha ou link mágico) + Postgres + RLS
- Importador Excel (`.xlsx`) das abas da planilha original

## Pré-requisitos

- Node.js 20+ (recomendado 22+)
- Conta no [Supabase](https://supabase.com/)

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Em **Project Settings → API**, copie **Project URL** e **anon public**.
3. No **SQL Editor**, execute:

   [`supabase/migrations/001_controladoria.sql`](supabase/migrations/001_controladoria.sql)

4. Em **Authentication → URL Configuration**, adicione:

   - `http://localhost:3000/auth/callback`
   - (produção) `https://SEU_DOMINIO/auth/callback`

## Variáveis de ambiente

```bash
cp .env.example .env.local
```

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon |
| `NEXT_PUBLIC_SITE_URL` | URL do app (`http://localhost:3000` em dev) |

Não use a `service_role` no frontend.

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm run start
npm run lint
```

## Fluxo de uso

1. Crie conta / entre (senha ou link mágico).
2. Vá em **Importar** e:
   - importe a planilha modelo (`data/planilha-modelo.xlsx`), ou
   - envie seu `.xlsx` com as mesmas abas.
3. Navegue: **Início → Dashboard → Agenda → Fluxo → Fixos → Empréstimos → Cartões → Cenários / Simulador → Prioridades → Patrimônio → Projeção**.
4. Marque itens como pagos na Agenda/Fixos/parcelas Caixa PJ; atualize utilizado dos cartões; rode cenários.

Conta nova sem importação = **estado vazio** (sem inventar histórico).

## Pré-visualização sem Supabase

```bash
APP_UI_PREVIEW=1 npm run dev
```

Carrega a planilha modelo só para UI (não grava no banco).

## Módulos (espelho das abas)

| App | Planilha |
| --- | --- |
| Início | Inicio |
| Dashboard | Dashboard |
| Agenda | Agenda |
| Contas | Contas_Ago_Jan |
| Fluxo | Fluxo_Diario |
| Fixos | Fixos |
| Empréstimos | Emprestimos |
| Cartões | Cartoes + Dash_Cartoes |
| Cenários / Simulador | Cenarios + Simulador |
| Prioridades | Prioridades (+ Ranking resumido) |
| Patrimônio | Patrimonio |
| Projeção | Projecao |

“Deixei de gastar” aparece como **juros evitados** nos cenários/simulador — não como lançamento avulso.

## Estrutura

```
data/planilha-modelo.xlsx     ← modelo para importação
supabase/migrations/          ← schema + RLS
src/lib/import/excel.ts       ← parser das abas
src/lib/domain/               ← tipos + KPIs + simulador
src/app/(app)/                ← telas autenticadas
```

## Observações

- Design acolhedor (verde sage), tipografia Sora + Source Sans 3, mobile-friendly.
- Saldos reais vivem no Supabase do usuário após importar — não ficam hardcoded no app.
- Ranking completo e CRUD fino de todas as células da planilha podem evoluir; o MVP já navega e calcula a partir dos dados importados.
