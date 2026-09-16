# APPFINANCAS

Aplicativo web de finanças pessoais do **Renan Illipronti**: registre **gastos**, o que você **deixou de gastar**, e acompanhe painéis por mês e por categoria — com conta na nuvem (Supabase) e sincronização entre dispositivos.

Interface em **português (Brasil)**.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com/) — Auth (e-mail/senha ou link mágico) + Postgres + RLS

## Pré-requisitos

- Node.js 20+ (recomendado 22+)
- Conta gratuita no [Supabase](https://supabase.com/)

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Em **Project Settings → API**, copie:
   - **Project URL**
   - **anon public** key
3. Em **SQL Editor**, execute o conteúdo de:

   [`supabase/migrations/001_transactions.sql`](supabase/migrations/001_transactions.sql)

   Isso cria a tabela `transactions`, índices e políticas RLS (cada usuário só acessa os próprios lançamentos).

4. Em **Authentication → URL Configuration**, adicione nas Redirect URLs:

   - `http://localhost:3000/auth/callback`
   - (em produção) `https://SEU_DOMINIO/auth/callback`

5. (Opcional) Em **Authentication → Providers → Email**, habilite confirmação de e-mail ou desative para testes locais.

## Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha:

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon (pública) |
| `NEXT_PUBLIC_SITE_URL` | URL do app (`http://localhost:3000` em dev) |

**Não** coloque a `service_role` key no frontend.

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Outros comandos

```bash
npm run build   # build de produção
npm run start   # sobe o build
npm run lint    # ESLint
```

## Como usar

1. Crie uma conta (e-mail/senha) ou entre com link mágico.
2. Em **+ Novo**, registre um **Gasto** ou **Deixei de gastar** (valor, categoria, data, observação opcional).
3. No **Painel**, veja totais do mês, categorias e tendência.
4. Em **Lançamentos**, filtre, edite ou exclua registros.
5. Em **Categorias**, veja o detalhamento do mês atual.

Os dados ficam no Postgres do Supabase, isolados por usuário via RLS. Sem inventar histórico: se a conta estiver vazia, a interface mostra estado vazio.

## Estrutura

```
src/
  app/
    login/                 ← autenticação
    auth/callback/         ← redirect OAuth / magic link
    (app)/dashboard/       ← painel
    (app)/transacoes/      ← lista, novo, editar
    (app)/categorias/      ← breakdown
    actions.ts             ← server actions (auth + CRUD)
  components/              ← UI
  lib/supabase/            ← clients e middleware
supabase/migrations/       ← SQL + RLS
.env.example
```

## Observações

- Design acolhedor (verde sage), tipografia Sora + Source Sans 3, pensado para celular.
- O PR anterior de site estático (Astro) era um esboço de marca; este app é o produto.
- Em produção (Vercel etc.), configure as mesmas variáveis de ambiente e a URL de callback no Supabase.
- Para pré-visualizar a UI sem Supabase (estado vazio): `APP_UI_PREVIEW=1 npm run dev` e abra `/preview`.
