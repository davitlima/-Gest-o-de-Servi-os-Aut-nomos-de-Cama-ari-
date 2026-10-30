# Plataforma Nexlar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar cadastro, perfis, chat, contratação, pagamento, avaliações e financeiro persistentes e seguros.

**Architecture:** API JSON em PHP 8.3 autenticada pelo Supabase, banco Postgres com RLS e frontend JavaScript. O Mercado Pago Checkout Pro é criado e confirmado exclusivamente pelo backend.

**Tech Stack:** PHP 8.3, JavaScript, Supabase Auth/Postgres, Mercado Pago Checkout Pro, Cypress.

**Spec:** `docs/superpowers/specs/2026-10-30-plataforma-nexlar-design.md`

## Global Constraints

- Preservar o visual e a estrutura HTML/CSS existentes.
- Cliente não acessa financeiro nem portfólio próprio; autônomo e empresa acessam ambos.
- Segredos somente em variáveis de ambiente; RLS em todas as tabelas públicas.
- Confirmação de e-mail e MFA TOTP para contas autenticadas.

## Review Focus

- Usuário cliente tentando abrir ou alterar registros financeiros deve receber 403.
- Mensagem não pode ser lida ou enviada por quem não participa da conversa.
- Avaliação duplicada ou antes da conclusão deve ser rejeitada.
- Webhook repetido não pode duplicar pagamento nem lançamento financeiro.
- Valor da proposta deve ser positivo e imutável após pagamento iniciado.

### Task 1: Fundação, esquema e autorização

**Files:** `api/`, `supabase/migrations/`, `tests/`

- [ ] Escrever testes que falhem para matriz de papéis, valores monetários e transições de estado.
- [ ] Implementar regras PHP mínimas e executar os testes até passarem.
- [ ] Criar esquema Supabase com tabelas, vínculos, índices, constraints e políticas RLS.

### Task 2: Autenticação e perfis separados

**Files:** `src/pages/cadastro.html`, `src/pages/login.html`, `src/js/auth.js`, páginas de perfil

- [ ] Criar cadastro por cliente, autônomo ou empresa, confirmação de e-mail e MFA TOTP.
- [ ] Carregar o papel autenticado e adaptar navegação, portfólio e financeiro.
- [ ] Testar visibilidade e proteção das rotas por papel.

### Task 3: Financeiro persistente

**Files:** `api/index.php`, `src/js/Painelfinanceiro.js`

- [ ] Criar endpoints autenticados de listar, criar, editar e excluir lançamentos.
- [ ] Substituir estado apenas em memória pelo carregamento e salvamento na API.
- [ ] Verificar persistência após recarregar e atualização dos gráficos e meta.

### Task 4: Chat e propostas

**Files:** `api/index.php`, `src/js/painelmensagens.js`, página de mensagens

- [ ] Criar endpoints de conversas, mensagens e propostas com autorização dos participantes.
- [ ] Renderizar conversas reais e atualizar novas mensagens por consulta periódica.
- [ ] Fazer o botão Contratar operar sobre proposta aceita com valor definido.

### Task 5: Checkout e avaliações

**Files:** `api/index.php`, perfil público, configuração de ambiente

- [ ] Criar preferência Mercado Pago e webhook idempotente.
- [ ] Persistir estados da contratação e criar lançamento financeiro do pagamento aprovado.
- [ ] Persistir avaliações elegíveis e recalcular média e quantidade do perfil.

### Task 6: Verificação completa

- [ ] Executar testes PHP, testes Cypress existentes e novos cenários críticos.
- [ ] Validar sintaxe PHP/JS, revisar segredos e documentar configuração local e produção.

