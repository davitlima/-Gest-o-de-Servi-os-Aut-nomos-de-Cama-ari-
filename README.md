# Nexlar

Plataforma para contratar profissionais autônomos de Camaçari, conversar, pagar, avaliar e acompanhar ganhos.

## Requisitos

- PHP 8.3 com cURL
- Composer
- Node.js 20 ou superior
- Projeto Supabase
- Aplicação Mercado Pago Checkout Pro

## Configuração

1. Copie `.env.example` para `.env` e preencha as credenciais. A chave `SUPABASE_SERVICE_ROLE_KEY` e os segredos do Mercado Pago ficam somente no servidor.
2. Execute a migration em `supabase/migrations` no projeto Supabase.
3. No Supabase Auth, habilite confirmação de e-mail e MFA por aplicativo autenticador.
4. Instale as dependências com `composer install` e `npm install`.
5. Exporte as variáveis do `.env` no processo PHP e inicie o projeto pela raiz:

```powershell
Get-Content .env | ForEach-Object {
  if ($_ -match '^([^#=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') }
}
php -S localhost:8000
```

Abra `http://localhost:8000`.

Para testar webhooks, `APP_URL` precisa ser uma URL HTTPS pública. Cadastre `https://SEU-DOMINIO/api/index.php?route=payments/webhook` em Webhooks > Pagamentos no Mercado Pago e copie a assinatura secreta para `MERCADO_PAGO_WEBHOOK_SECRET`.

## Verificação

```bash
php tests/run.php
php -l api/index.php
npm test
```

O checkout usa o ambiente correspondente ao token do Mercado Pago. Use credenciais de teste antes de produção.
