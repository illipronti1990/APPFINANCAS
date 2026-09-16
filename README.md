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
2. Vá em **Importar** e carregue a planilha (modelo ou seu `.xlsx`) — opcional se preferir digitar tudo na UI.
3. No dia a dia, use **Adicionar / Editar / Excluir** em cada módulo (veja abaixo).
4. Navegue: **Início → Dashboard → Agenda → Fluxo → Fixos → Empréstimos → Cartões → Cenários / Simulador → Prioridades → Patrimônio → Projeção**.

Conta nova sem dados = **estado vazio** (“Importe a planilha ou adicione o primeiro item”).

## Como inserir e excluir dados

Cada tela principal tem botões claros de **Adicionar** (painel expansível) e **Excluir** (com confirmação). **Editar** abre o formulário na própria linha.

| Tela | O que você pode fazer |
| --- | --- |
| **Agenda** | Adicionar/editar/excluir vencimentos (dia, conta, valor, pago, categoria, mês/ano). Marcar pago. |
| **Fixos** | Adicionar/editar/excluir despesas fixas (valor, dia, banco, até quando, pago). |
| **Empréstimos** | Adicionar/editar/excluir empréstimos parcelados e dívidas em aberto; gerenciar parcelas Caixa PJ (inclui marcar pago). |
| **Cartões** | Adicionar/editar/excluir cartões; editar limite, utilizado, faturas, dias. |
| **Contas** | Adicionar/excluir linhas da matriz; editar valores mês a mês. |
| **Fluxo** | Editar saldo inicial; adicionar/editar/excluir dias; **Regenerar saídas a partir da Agenda** (mantém entradas). |
| **Patrimônio** | Adicionar/editar/excluir ativos e passivos. |
| **Importar** | Carga em massa (mantida) + **Apagar todos os meus dados** (digite `APAGAR` + confirmação). |

### Fluxo sugerido no caixa diário

1. Defina o **saldo inicial** do mês.
2. Lance **entradas** (salário, adiantamentos) nos dias certos.
3. Clique **Regenerar saídas a partir da Agenda** ou edite dias manualmente.
4. Dias com saldo negativo mostram **SEM CAIXA**.

Não é necessário reimportar a planilha inteira para cada ajuste pontual.

## Pré-visualização sem Supabase

```bash
APP_UI_PREVIEW=1 npm run dev
```

Carrega a planilha modelo só para UI (formulários aparecem; gravação na nuvem exige Supabase configurado).

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
src/app/actions/crud.ts       ← criar / editar / excluir
src/app/(app)/                ← telas autenticadas
```

## Observações

- Design acolhedor (verde sage), tipografia Sora + Source Sans 3, mobile-friendly.
- Saldos reais vivem no Supabase do usuário após importar ou digitar — não ficam hardcoded no app.
- Importação em massa continua disponível; o dia a dia é CRUD na interface.
