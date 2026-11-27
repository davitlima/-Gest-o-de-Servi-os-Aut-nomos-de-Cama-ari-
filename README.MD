# Nexlar Camaçari

Plataforma que conecta clientes, profissionais autônomos e empresas para contratação de serviços locais. Contas de autônomo e empresa podem oferecer serviços; empresas também podem contratar.

## Recursos

- cadastro por papel com confirmação de e-mail e MFA TOTP;
- busca e perfis carregados do Supabase;
- portfólio, chat, contratos e avaliações persistentes;
- painel financeiro com lançamentos e meta mensal;
- checkout AbacatePay após a proposta no chat (Mercado Pago permanece como fallback);
- taxa da plataforma de 15% e registro líquido de 85% no financeiro.

O checkout usa a conta configurada em `ABACATEPAY_API_KEY` quando essa variável está presente; caso contrário, usa Mercado Pago. O repasse bancário automático ao prestador exige uma integração de transferência habilitada e não deve ser anunciado como ativo enquanto não estiver configurada.

## Requisitos e configuração

1. PHP 8.1 ou superior e Composer.
2. Execute `composer install`.
3. Copie `.env.example` para `.env` e preencha as variáveis.
4. Aplique, em ordem, os arquivos de `supabase/migrations` no projeto Supabase.
5. No Supabase Auth, mantenha confirmação de e-mail habilitada e cadastre a URL publicada como redirect permitida.
6. Configure as mesmas variáveis na Vercel para Preview e Production.

## Administração e restrição de contas

- Configure `NEXLAR_ADMIN_EMAILS` somente no ambiente do servidor, com os e-mails individuais das pessoas administradoras separados por vírgula. Cada pessoa usa sua própria conta Supabase; não existe senha genérica compartilhada.
- Depois de aplicar a migração `nexlar_account_controls`, ative em Supabase Authentication → Hooks → Before User Created a função `public.nexlar_reject_restricted_signup`. Sem esse hook, cadastros diretos feitos fora das telas do Nexlar ainda podem chegar ao Supabase Auth.
- A lista `public.account_restrictions` guarda CPF, telefone e e-mail normalizados, com acesso negado a `anon` e `authenticated`. As políticas RLS também negam acesso a contas que coincidam com a lista, e o painel usa o Auth Admin API no servidor para suspender as contas já existentes.
- O painel fica em `/src/pages/admin.html`. O login administrativo é o login normal; o e-mail precisa estar no `NEXLAR_ADMIN_EMAILS` e ter uma conta Nexlar com perfil cadastrado.
- A restrição não apaga histórico, contratos ou avaliações. A lista precisa ser tratada conforme a política de privacidade e o prazo de retenção definidos pela Nexlar.

O backend PHP é servido por `/api/index.php?route=...`. Nunca exponha `SUPABASE_SERVICE_ROLE_KEY`, chaves de pagamento ou segredos de webhook no frontend. Se uma chave for compartilhada acidentalmente, revogue-a e gere outra antes da publicação.

## Execução local

```bash
composer install
php -S 127.0.0.1:8000
```

Abra `http://127.0.0.1:8000`.

## Testes

```bash
npm test
```

Antes de publicar, valide também os cadastros dos três papéis, MFA, chat, contratação, checkout, avaliação e persistência do financeiro em um ambiente de teste.

Projeto acadêmico desenvolvido pela equipe Nexlar.

