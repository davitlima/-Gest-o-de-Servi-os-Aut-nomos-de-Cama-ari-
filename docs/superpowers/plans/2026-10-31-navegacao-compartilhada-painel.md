# Navegação Compartilhada do Painel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer Meu Perfil, Financeiro e Mensagens usarem uma única sidebar responsiva baseada no padrão atual do painel financeiro.

**Architecture:** Um Web Component sem dependências renderizará a estrutura semântica da navegação, marcará a rota ativa e controlará o drawer móvel. Um CSS compartilhado será a única fonte dos estilos da sidebar; cada página manterá apenas seus estilos de conteúdo.

**Tech Stack:** HTML, CSS, JavaScript nativo, testes PHP estruturais e Node.js.

**Spec:** `docs/superpowers/specs/2026-10-31-navegacao-compartilhada-painel-design.md`

## Global Constraints

- Aplicar somente a `Meuperfil.html`, `Painelfinanceiro.html` e `painelmensagens.html`.
- Manter `inicio.html` inalterado.
- Preservar o padrão visual atual do painel financeiro.
- Manter alvos de toque de pelo menos 44 px, safe areas, foco visível e movimento reduzido.
- Não alterar permissões do backend nem conteúdo principal das páginas.

## Review Focus

- JavaScript indisponível: o componente não pode ocultar o conteúdo principal da página.
- Rota ativa desconhecida: nenhum link deve ser marcado incorretamente.
- Troca de breakpoint com drawer aberto: overlay e bloqueio de rolagem devem ser limpos.
- Navegação por teclado: Escape fecha e devolve foco ao botão de abertura.
- Link Financeiro: deve permanecer presente nas três páginas independentemente do papel retornado pela API.

---

### Task 1: Componente compartilhado da navegação

**Files:**
- Create: `src/js/panel-nav.js`
- Create: `src/css/panel-nav.css`
- Create: `tests/panel-nav.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: elemento `<nexlar-panel-nav active="perfil|financeiro|mensagens">` e método interno `setOpen(open, returnFocus)`.

- [ ] **Step 1: Escrever testes falhando** para os quatro links, `aria-current`, rota desconhecida, abertura/fechamento, Escape e limpeza ao entrar no breakpoint desktop.
- [ ] **Step 2: Executar `node tests/panel-nav.test.js`** e confirmar falha pela ausência do componente.
- [ ] **Step 3: Implementar `src/js/panel-nav.js`** com template único, SVGs existentes, estado ativo e drawer acessível.
- [ ] **Step 4: Implementar `src/css/panel-nav.css`** extraindo o visual financeiro atual, breakpoints, safe areas, foco e `prefers-reduced-motion`.
- [ ] **Step 5: Adicionar o teste ao script `npm test`** e confirmar `npm test` passando.
- [ ] **Step 6: Commitar** com `feat: compartilhar navegacao do painel`.

### Task 2: Migrar as três páginas

**Files:**
- Modify: `src/pages/Meuperfil.html`
- Modify: `src/pages/Painelfinanceiro.html`
- Modify: `src/pages/painelmensagens.html`
- Modify: `src/css/Meuperfil.css`
- Modify: `src/css/Painelfinanceiro.css`
- Modify: `src/css/painelmensagens.css`
- Modify: `src/js/Painelfinanceiro.js`
- Modify: `src/js/painelmensagens.js`
- Modify: `tests/run.php`

**Interfaces:**
- Consumes: `<nexlar-panel-nav active>` da Task 1.
- Produces: três páginas sem HTML, CSS ou manipuladores duplicados de navegação.

- [ ] **Step 1: Escrever testes estruturais falhando** exigindo o componente e o valor ativo correto nas três páginas, e proibindo sidebars/manipuladores antigos.
- [ ] **Step 2: Executar `php tests/run.php`** e confirmar falha nas páginas ainda não migradas.
- [ ] **Step 3: Substituir as três sidebars** pelo componente e carregar `panel-nav.css` e `panel-nav.js` em cada página.
- [ ] **Step 4: Remover CSS e JavaScript duplicados** sem alterar estilos ou comportamento do conteúdo principal.
- [ ] **Step 5: Executar `npm test`, `node --check` e `git diff --check`** e confirmar sucesso.
- [ ] **Step 6: Commitar** com `refactor: unificar navbar do painel`.

### Task 3: Inspeção e publicação

**Files:**
- Modify somente se a inspeção revelar defeito: arquivos das Tasks 1 e 2.

**Interfaces:**
- Consumes: três páginas migradas e testes verdes.
- Produces: branch `dev` publicada e verificada em produção.

- [ ] **Step 1: Inspecionar em lote** Meu Perfil, Financeiro e Mensagens em 320×568, 390×844 e 1440×900, com drawer fechado e aberto.
- [ ] **Step 2: Corrigir em um único lote** qualquer overflow, diferença visual ou falha de foco encontrada e repetir apenas uma confirmação visual.
- [ ] **Step 3: Executar uma vez o detector Impeccable** nos três HTMLs alterados.
- [ ] **Step 4: Executar `npm test`, checagens de sintaxe e `git diff --check`** como verificação final.
- [ ] **Step 5: Atualizar `dev` pela conta `davitlima`** com proteção por SHA esperado.
- [ ] **Step 6: Publicar na Vercel e confirmar `READY`**, o SHA correto e os marcadores do componente no domínio público.

