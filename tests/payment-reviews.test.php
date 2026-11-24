<?php

declare(strict_types=1);

require __DIR__ . '/../api/Domain.php';

use Nexlar\Domain;

function check(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

check(method_exists(Domain::class, 'validAbacatePayCheckout'), 'Webhook deve validar checkout pago vinculado ao pedido.');
check(method_exists(Domain::class, 'abacatePayWebhookCheckout'), 'Webhook v2 deve extrair checkout de data.checkout.');
check(method_exists(Domain::class, 'abacatePayContractId'), 'External ID deve ser analisado estritamente.');
check(method_exists(Domain::class, 'verifyAbacatePaySignature'), 'Webhook deve validar HMAC do corpo original.');


check(Domain::abacatePayModeMatches(true, true), 'Chave de teste deve operar somente com checkout de teste.');
check(!Domain::abacatePayModeMatches(false, true), 'Checkout de produção deve ser recusado no sandbox.');
$api = file_get_contents(__DIR__ . '/../api/index.php');
check(str_contains($api, "'/checkouts/get?id='"), 'Webhook deve consultar o checkout diretamente na AbacatePay.');
check(str_contains($api, "Config::get('ABACATEPAY_API_KEY', false)") && str_contains($api, "Config::get('ABACATEPAY_WEBHOOK_SECRET', false)"), 'A integração deve manter os nomes de credencial já usados no projeto.');
check(str_contains($api, "Domain::validAbacatePayCheckout($verifiedCheckout, $contract, true)"), 'Webhook deve aceitar somente pagamentos AbacatePay sandbox.');
check(str_contains($api, "Domain::abacatePayModeMatches(\$checkout['devMode'] ?? null, true)"), 'Checkout AbacatePay deve permanecer em sandbox.');
check(!str_contains($api, 'abacatePayIsProduction'), 'O modo sandbox deve ser independente do ambiente Vercel.');
check(!str_contains($api, 'mercadoPago') && !str_contains($api, 'MERCADO_PAGO'), 'AbacatePay deve ser a única integração de pagamento.');
check(str_contains($api, 'HTTP_X_WEBHOOK_SIGNATURE') && str_contains($api, 'HTTP_X_WEBHOOK_SECRET'), 'Webhook deve conferir assinatura e segredo.');
check(str_contains($api, 'reviewed_by_me'), 'Chat deve esconder o convite depois da avaliação.');
$contract = ['id' => 42, 'amount' => 67.00, 'abacatepay_checkout_id' => 'bill_abc123'];
$checkout = ['id' => 'bill_abc123', 'externalId' => 'nexlar-contract-42', 'status' => 'PAID', 'amount' => 6700, 'paidAmount' => 6700, 'devMode' => true];
check(Domain::validAbacatePayCheckout($checkout, $contract, true), 'Checkout pago e vinculado ao contrato deve ser aceito.');
foreach ([
    ['externalId' => 'nexlar-contract-43'],
    ['paidAmount' => 6600],
    ['amount' => 6600],
    ['status' => 'PENDING'],
    ['id' => 'bill_other'],
    ['devMode' => false],
] as $changes) {
    check(!Domain::validAbacatePayCheckout(array_merge($checkout, $changes), $contract, true), 'Webhook divergente não pode confirmar o pedido.');
}

$event = ['event' => 'checkout.completed', 'data' => ['checkout' => $checkout]];
check(Domain::abacatePayWebhookCheckout($event) === $checkout, 'Webhook v2 deve fornecer checkout verificado.');
check(Domain::abacatePayWebhookCheckout(['event' => 'checkout.refunded', 'data' => ['checkout' => $checkout]]) === null, 'Evento diferente de pagamento não deve ser processado como confirmação.');
check(Domain::abacatePayContractId('nexlar-contract-42') === 42, 'External ID correto deve apontar para o pedido.');
check(Domain::abacatePayContractId('pedido-42-malicioso') === null, 'External ID inesperado deve ser rejeitado.');

$raw = '{"event":"checkout.completed"}';
$key = 't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9';
$signature = base64_encode(hash_hmac('sha256', $raw, $key, true));
check(Domain::verifyAbacatePaySignature($raw, $signature), 'Assinatura válida deve ser aceita.');
check(!Domain::verifyAbacatePaySignature($raw . ' ', $signature), 'Alteração no corpo deve invalidar assinatura.');

$paymentRealtimeMigrations = glob(__DIR__ . '/../supabase/migrations/*contract_payment_realtime*.sql') ?: [];
check(count($paymentRealtimeMigrations) === 1, 'Contratos devem ter migração Realtime para confirmar a entrega do pedido no chat.');
$paymentRealtime = strtolower(file_get_contents($paymentRealtimeMigrations[0]));
check(str_contains($paymentRealtime, 'alter publication supabase_realtime add table public.contracts'), 'Atualizações de pagamento devem chegar ao chat em tempo real.');
$chat = file_get_contents(__DIR__ . '/../src/js/painelmensagens.js');
check(str_contains($chat, "table: 'contracts'"), 'Chat deve atualizar quando o pagamento confirmar o pedido.');
$reviewMigrations = glob(__DIR__ . '/../supabase/migrations/*review_integrity*.sql') ?: [];
check(count($reviewMigrations) === 1, 'Correção de vínculo RLS deve existir em uma migração.');
$reviewPolicy = strtolower(file_get_contents($reviewMigrations[0]));
check(str_contains($reviewPolicy, 'c.provider_id = reviews.provider_id'), 'RLS deve vincular o prestador avaliado ao pedido.');
check(str_contains($reviewPolicy, "c.status = 'concluido'"), 'RLS só deve aceitar pedidos concluídos.');

fwrite(STDOUT, "Payment and review integrity tests passed.\n");
