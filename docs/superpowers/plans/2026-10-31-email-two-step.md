# Email Two-Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exigir senha e link de uso único por e-mail em todo login, sem QR Code.

**Architecture:** O backend registra um desafio somente para JWT autenticado por senha e, depois da verificação do OTP pelo Supabase, vincula a sessão atual ao desafio. As rotas protegidas consultam esse vínculo em vez de exigir AAL2/TOTP.

**Tech Stack:** PHP, Supabase Auth/Postgres, JavaScript, HTML/CSS.

**Spec:** `docs/superpowers/specs/2026-10-31-email-two-step-design.md`

## Global Constraints

- Não expor `service_role` no navegador.
- Não permitir que um OTP solicitado sem senha libere as APIs.
- Exigir o link de uso único em todo novo login.
- Remover toda interface de QR Code.

## Review Focus

- OTP solicitado sem senha prévia deve falhar no endpoint de conclusão.
- Desafio expirado ou já consumido deve falhar.
- Usuário diferente não pode consumir o desafio.
- Sessão sem `session_id` não pode ser liberada.
- Reenvio deve invalidar desafios anteriores e manter um único desafio ativo.

---

### Task 1: Persistência e validação do desafio

**Files:**
- Create: `supabase/migrations/20261031123000_email_two_step.sql`
- Modify: `api/Domain.php`
- Test: `tests/run.php`

**Interfaces:**
- Produces: tabelas privadas para desafios e sessões verificadas; helpers para ler `amr`, `sub` e `session_id` do JWT.

- [ ] Escrever testes que falham para leitura do método de autenticação e do `session_id`.
- [ ] Executar `npm test` e confirmar a falha esperada.
- [ ] Implementar os helpers e a migração com expiração, uso único e RLS sem acesso público.
- [ ] Aplicar a migração e executar os testes.

### Task 2: Endpoints de início e conclusão

**Files:**
- Modify: `api/index.php`
- Modify: `api/Supabase.php`
- Test: `tests/run.php`

**Interfaces:**
- Produces: `POST auth/email-step/start`, `POST auth/email-step/complete` e verificação de sessão para rotas protegidas.

- [ ] Escrever testes de contrato que falham para as novas rotas e remoção da exigência AAL2.
- [ ] Executar os testes e confirmar a falha esperada.
- [ ] Implementar início com JWT `password`, conclusão para o mesmo usuário e sessão, expiração e consumo único.
- [ ] Executar todos os testes.

### Task 3: Interface de login por link

**Files:**
- Modify: `src/pages/login.html`
- Modify: `src/js/auth.js`
- Modify: `src/css/auth.css`
- Test: `tests/email-step.test.js`

**Interfaces:**
- Consumes: endpoints da Task 2 e Supabase `signInWithOtp`/`verifyOtp`.
- Produces: formulário em duas etapas sem QR Code.

- [ ] Escrever teste comportamental que falha para transição senha → link e ausência de QR.
- [ ] Executar o teste e confirmar a falha esperada.
- [ ] Implementar envio, reenvio, verificação e mensagens em português.
- [ ] Executar todos os testes.

### Task 4: Limpeza, publicação e verificação

**Files:**
- Verify: `src/pages/login.html`

**Interfaces:**
- Consumes: fluxo completo das Tasks 1–3.
- Produces: branch `dev` e produção Vercel atualizadas.

- [ ] Remover o fator TOTP incompleto do usuário afetado.
- [ ] Executar `npm test`, verificações de sintaxe e fluxo em produção.
- [ ] Commitar e atualizar `dev` no GitHub.
- [ ] Publicar na Vercel e confirmar o deploy `READY`.

