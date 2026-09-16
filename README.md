# Site pessoal — Renan Illipronti

Site de marca pessoal / sobre mim, focado em **educação financeira**. Feito com [Astro](https://astro.build/), estático, sem autenticação nem CMS.

## Como rodar localmente

Pré-requisito: Node.js 22.12 ou superior.

```bash
npm install
npm run dev
```

Abra o endereço indicado no terminal (geralmente `http://localhost:4321`).

### Outros comandos

```bash
npm run build    # gera o site em dist/
npm run preview  # pré-visualiza o build de produção
```

## Onde editar os textos (português)

Todo o conteúdo em português fica em um único arquivo:

- [`src/content/site.ts`](src/content/site.ts)

Lá você pode alterar:

- nome, e-mail e metadados
- textos do hero (nome, frase, CTA)
- seção Sobre
- os 3 temas de ajuda
- CTA de contato
- nota do rodapé

Depois de salvar, o servidor de desenvolvimento atualiza a página automaticamente.

## Estrutura principal

```
src/
  content/site.ts      ← textos em português
  components/          ← seções da página
  layouts/BaseLayout.astro
  pages/index.astro    ← página única
  styles/global.css    ← cores, tipografia e base
public/
  favicon.svg
```

## Observações

- Idioma principal da interface: português (Brasil)
- Design simples e acolhedor, pensado para celular primeiro
- Sem depoimentos, métricas ou credenciais inventadas — use apenas o que for real quando for publicar
