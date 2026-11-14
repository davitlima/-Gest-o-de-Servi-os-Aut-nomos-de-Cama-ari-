<?php

declare(strict_types=1);

use Nexlar\Config;
use Nexlar\Domain;
use Nexlar\HttpError;
use Nexlar\Supabase;
use MercadoPago\Exceptions\InvalidWebhookSignatureException;
use MercadoPago\Webhook\WebhookSignatureValidator;

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/Config.php';
require __DIR__ . '/Domain.php';
require __DIR__ . '/Supabase.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new HttpError(400, 'JSON inválido.');
    }
    return $data;
}

function bearer(): string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $match)) {
        throw new HttpError(401, 'Sessão necessária.');
    }
    return $match[1];
}

function query(string $name, string $default = ''): string
{
    return isset($_GET[$name]) ? trim((string) $_GET[$name]) : $default;
}

function profile(Supabase $db, string $token, string $userId): array
{
    $rows = $db->rest('GET', 'profiles?id=eq.' . rawurlencode($userId) . '&select=*', null, $token);
    if (!isset($rows[0])) {
        throw new HttpError(404, 'Perfil não encontrado.');
    }
    $private = $db->rest('GET', 'profile_private?user_id=eq.' . rawurlencode($userId) . '&select=phone,document,pix_key_type', null, $token);
    return array_merge($rows[0], $private[0] ?? ['phone' => null, 'document' => null, 'pix_key_type' => null]);
}

function mercadoPago(string $method, string $path, ?array $body = null, ?string $idempotencyKey = null): array
{
    $headers = ['Authorization: Bearer ' . Config::get('MERCADO_PAGO_ACCESS_TOKEN'), 'Content-Type: application/json'];
    if ($idempotencyKey !== null) $headers[] = 'X-Idempotency-Key: ' . $idempotencyKey;
    $handle = curl_init('https://api.mercadopago.com' . $path);
    curl_setopt_array($handle, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
    ]);
    if ($body !== null) {
        curl_setopt($handle, CURLOPT_POSTFIELDS, json_encode($body, JSON_THROW_ON_ERROR));
    }
    $response = curl_exec($handle);
    $status = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    $decoded = is_string($response) ? json_decode($response, true) : null;
    if ($status < 200 || $status >= 300 || !is_array($decoded)) {
        throw new HttpError(502, 'Não foi possível comunicar com o Mercado Pago.');
    }
    return $decoded;
}

function abacatePay(string $method, string $path, ?array $body = null, ?string $idempotencyKey = null, bool $notFoundIsEmpty = false): array
{
    $headers = ['Authorization: Bearer ' . Config::get('ABACATEPAY_API_KEY'), 'Content-Type: application/json'];
    if ($idempotencyKey !== null) $headers[] = 'Idempotency-Key: ' . $idempotencyKey;
    $handle = curl_init('https://api.abacatepay.com/v2' . $path);
    curl_setopt_array($handle, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20]);
    if ($body !== null) curl_setopt($handle, CURLOPT_POSTFIELDS, json_encode($body, JSON_THROW_ON_ERROR));
    $response = curl_exec($handle);
    $status = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    $decoded = is_string($response) ? json_decode($response, true) : null;
    $missingProduct = $notFoundIsEmpty && $status === 400 && is_array($decoded)
        && strcasecmp(trim((string) ($decoded['error'] ?? '')), 'Product not found') === 0;
    if ($notFoundIsEmpty && ($status === 404 || $missingProduct)) return [];
    if ($status < 200 || $status >= 300 || !is_array($decoded) || ($decoded['success'] ?? true) === false) {
        error_log('AbacatePay ' . $method . ' ' . $path . ' HTTP ' . $status . ': ' . substr((string) $response, 0, 1200));
        if ($status === 401) throw new HttpError(502, 'A chave da AbacatePay está inválida. Confira ABACATEPAY_API_KEY.');
        if ($status === 403) throw new HttpError(502, 'A chave da AbacatePay precisa das permissões PRODUCT:READ, PRODUCT:CREATE e CHECKOUT:CREATE.');
        throw new HttpError(502, 'Não foi possível comunicar com a AbacatePay. Tente novamente em instantes.');
    }
    return is_array($decoded['data'] ?? null) ? $decoded['data'] : $decoded;
}

try {
    $db = Supabase::fromEnvironment();
    $route = trim(query('route'), '/');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($route === 'config' && $method === 'GET') {
        respond([
            'supabaseUrl' => Config::get('SUPABASE_URL'),
            'supabaseKey' => Config::get('SUPABASE_PUBLISHABLE_KEY'),
        ]);
    }

    if ($route === 'public/profile' && $method === 'GET') {
        $profileId = query('id');
        if ($profileId === '') throw new HttpError(422, 'Perfil não informado.');
        $profiles = $db->rest('GET', 'profiles?id=eq.' . rawurlencode($profileId) . '&select=id,role,full_name,neighborhood,bio,service_category,avatar_url,company_name,portfolio_items(*),reviews!reviews_provider_id_fkey(contract_id,rating,comment,created_at,reviewer:profiles!reviews_reviewer_id_fkey(full_name,avatar_url))', null, Config::get('SUPABASE_PUBLISHABLE_KEY'));
        if (!isset($profiles[0])) throw new HttpError(404, 'Perfil não encontrado.');
        respond($profiles[0]);
    }

    if ($route === 'public/profiles' && $method === 'GET') {
        respond($db->rest('GET', 'profiles?role=in.(autonomo,empresa)&select=id,full_name,company_name,service_category,neighborhood,bio,avatar_url,reviews!reviews_provider_id_fkey(rating)&order=created_at.desc', null, Config::get('SUPABASE_PUBLISHABLE_KEY')));
    }

    if ($route === 'payments/webhook' && $method === 'POST') {
        $payload = input();
        $paymentId = query('data_id') ?: (string) ($payload['data']['id'] ?? '');
        if ($paymentId === '') {
            respond(['received' => true]);
        }
        try {
            WebhookSignatureValidator::validate(
                $_SERVER['HTTP_X_SIGNATURE'] ?? null,
                $_SERVER['HTTP_X_REQUEST_ID'] ?? null,
                $paymentId,
                Config::get('MERCADO_PAGO_WEBHOOK_SECRET'),
                300,
            );
        } catch (InvalidWebhookSignatureException) {
            throw new HttpError(401, 'Assinatura de webhook inválida.');
        }
        $payment = mercadoPago('GET', '/v1/payments/' . rawurlencode($paymentId));
        $contractId = (int) ($payment['external_reference'] ?? 0);
        if ($contractId > 0) {
            $status = ($payment['status'] ?? '') === 'approved' ? 'pago' : (($payment['status'] ?? '') === 'rejected' ? 'recusado' : null);
            if ($status !== null) {
                $contracts = $db->rest('GET', 'contracts?id=eq.' . $contractId . '&select=*', null, '', true);
                $contract = $contracts[0] ?? null;
                $amountMatches = abs((float) ($payment['transaction_amount'] ?? 0) - (float) ($contract['amount'] ?? -1)) < 0.001;
                $currencyMatches = ($payment['currency_id'] ?? '') === 'BRL';
                $preferenceMatches = (string) ($payment['preference_id'] ?? '') === (string) ($contract['mercado_pago_preference_id'] ?? '');
                if ($contract && $contract['status'] === 'aguardando_pagamento' && $amountMatches && $currencyMatches && $preferenceMatches) {
                    $db->rest('PATCH', 'contracts?id=eq.' . $contractId, [
                        'status' => $status,
                        'mercado_pago_payment_id' => (string) $paymentId,
                        'updated_at' => gmdate('c'),
                    ], '', true);
                    if ($status === 'pago') {
                        $db->rest('POST', 'financial_entries', [[
                            'owner_id' => $contract['provider_id'],
                            'contract_id' => $contractId,
                            'name' => $contract['description'],
                            'amount' => Domain::providerNet((float) $contract['amount']),
                            'service_date' => gmdate('Y-m-d'),
                            'status' => 'Pendente',
                            'source' => 'pagamento',
                        ]], '', true);
                    }
                }
            }
        }
        respond(['received' => true]);
    }

    if ($route === 'payments/abacatepay/webhook' && $method === 'POST') {
        $secret = query('webhookSecret');
        if ($secret === '' || !hash_equals(Config::get('ABACATEPAY_WEBHOOK_SECRET'), $secret)) throw new HttpError(401, 'Webhook não autorizado.');
        $payload = input();
        if (($payload['event'] ?? $payload['type'] ?? '') !== 'checkout.completed') respond(['received' => true]);
        $data = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;
        $externalId = (string) ($data['externalId'] ?? $data['metadata']['contract_id'] ?? '');
        $contractId = (int) preg_replace('/[^0-9]/', '', $externalId);
        if ($contractId > 0) {
            $contracts = $db->rest('GET', 'contracts?id=eq.' . $contractId . '&select=*', null, '', true);
            $contract = $contracts[0] ?? null;
            if ($contract && in_array($contract['status'], ['aguardando_pagamento', 'pago'], true)) {
                $db->rest('POST', 'rpc/register_abacatepay_payment', [
                    'p_contract_id' => $contractId,
                    'p_payment_id' => (string) ($data['id'] ?? $data['checkoutId'] ?? ('checkout-' . $contractId)),
                ], '', true);
            }
        }
        respond(['received' => true]);
    }

    if ($route === 'payments/release-due' && $method === 'GET') {
        $secret = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
        $expected = 'Bearer ' . Config::get('CRON_SECRET');
        if (!hash_equals($expected, $secret)) throw new HttpError(401, 'Cron não autorizado.');
        $db->rest('POST', 'rpc/release_due_service_payouts', ['p_limit' => 100], '', true);
        $payouts = $db->rest('POST', 'rpc/claim_provider_payouts', ['p_limit' => 1], '', true);
        $processed = 0;
        foreach ($payouts as $payout) {
            $submitted = false;
            try {
                $private = $db->rest('GET', 'profile_private?user_id=eq.' . rawurlencode((string) $payout['provider_id']) . '&select=pix_key,pix_key_type', null, '', true)[0] ?? [];
                if (empty($private['pix_key']) || empty($private['pix_key_type'])) throw new RuntimeException('Prestador sem chave Pix cadastrada.');
                $submitted = true;
                $transfer = abacatePay('POST', '/pix/send', [
                    'amount' => (int) round(((float) $payout['transfer_request_amount']) * 100),
                    'externalId' => (string) $payout['external_id'],
                    'description' => 'Repasse Nexlar contrato ' . $payout['contract_id'],
                    'pix' => ['key' => (string) $private['pix_key'], 'type' => (string) $private['pix_key_type']],
                ], (string) $payout['external_id']);
                $transferStatus = strtoupper((string) ($transfer['status'] ?? ''));
                $status = $transferStatus === 'COMPLETE' ? 'pago' : ($transferStatus === 'FAILED' ? 'falhou' : 'processando');
                $db->rest('POST', 'rpc/record_provider_payout_result', [
                    'p_payout_id' => (int) $payout['id'], 'p_status' => $status,
                    'p_transfer_id' => (string) ($transfer['id'] ?? ''), 'p_receipt_url' => (string) ($transfer['receiptUrl'] ?? ''),
                    'p_transfer_fee' => isset($transfer['platformFee']) ? ((float) $transfer['platformFee'] / 100) : 0,
                    'p_provider_received' => isset($transfer['amount']) ? ((float) $transfer['amount'] / 100) : (float) $payout['transfer_request_amount'],
                ], '', true);
            } catch (Throwable $error) {
                $db->rest('POST', 'rpc/record_provider_payout_result', [
                    'p_payout_id' => (int) $payout['id'], 'p_status' => $submitted ? 'processando' : 'falhou', 'p_failure_reason' => mb_substr($error->getMessage(), 0, 900),
                ], '', true);
            }
            $processed++;
        }
        respond(['released' => $processed]);
    }

    $token = bearer();
    $user = $db->user($token);
    $userId = (string) ($user['id'] ?? '');
    if ($userId === '') {
        throw new HttpError(401, 'Sessão inválida.');
    }
    $me = profile($db, $token, $userId);

    if ($route === 'finance/payouts' && $method === 'GET') {
        if (!Domain::canUseFinance($me['role'])) throw new HttpError(403, 'Seu perfil não possui painel financeiro.');
        respond($db->rest('GET', 'provider_payouts?provider_id=eq.' . rawurlencode($userId) . '&select=*&order=created_at.desc', null, $token));
    }

    if ($route === 'finance/pix-key' && $method === 'PUT') {
        if (!Domain::canUseFinance($me['role'])) throw new HttpError(403, 'Seu perfil não possui painel financeiro.');
        $data = input();
        $key = trim((string) ($data['pix_key'] ?? ''));
        $type = strtoupper(trim((string) ($data['pix_key_type'] ?? '')));
        if (!in_array($type, ['CPF', 'CNPJ', 'PHONE', 'EMAIL', 'RANDOM'], true) || $key === '' || mb_strlen($key) > 200) throw new HttpError(422, 'Informe uma chave Pix válida e seu tipo.');
        $digits = preg_replace('/\D+/', '', $key);
        $validKey = match ($type) {
            'CPF' => strlen($digits) === 11,
            'CNPJ' => strlen($digits) === 14,
            'PHONE' => strlen($digits) >= 10 && strlen($digits) <= 13,
            'EMAIL' => filter_var($key, FILTER_VALIDATE_EMAIL) !== false,
            'RANDOM' => preg_match('/^[a-f0-9-]{32,36}$/i', $key) === 1,
        };
        if (!$validKey) throw new HttpError(422, 'A chave Pix não corresponde ao tipo selecionado.');
        $path = 'profile_private?user_id=eq.' . rawurlencode($userId);
        $existing = $db->rest('GET', $path . '&select=user_id', null, $token);
        if ($existing) $db->rest('PATCH', $path, ['pix_key' => $key, 'pix_key_type' => $type], $token);
        else $db->rest('POST', 'profile_private', [['user_id' => $userId, 'pix_key' => $key, 'pix_key_type' => $type]], $token);
        respond(['pix_key_type' => $type, 'configured' => true]);
    }

    if ($route === 'finance/pix-key' && $method === 'GET') {
        if (!Domain::canUseFinance($me['role'])) throw new HttpError(403, 'Seu perfil não possui painel financeiro.');
        $private = $db->rest('GET', 'profile_private?user_id=eq.' . rawurlencode($userId) . '&select=pix_key_type,pix_key', null, $token)[0] ?? [];
        $key = (string) ($private['pix_key'] ?? '');
        respond(['pix_key_type' => $private['pix_key_type'] ?? null, 'configured' => $key !== '', 'pix_key_hint' => $key === '' ? '' : str_repeat('•', max(0, mb_strlen($key) - 4)) . mb_substr($key, -4)]);
    }

    if (preg_match('#^finance/payouts/(\d+)/retry$#', $route, $match) && $method === 'POST') {
        if (!Domain::canUseFinance($me['role'])) throw new HttpError(403, 'Seu perfil não possui painel financeiro.');
        respond($db->rest('POST', 'rpc/retry_provider_payout', ['p_payout_id' => (int) $match[1], 'p_actor_id' => $userId], '', true));
    }

    if ($route === 'agenda' && $method === 'GET') {
        if (!Domain::canUseFinance($me['role'])) throw new HttpError(403, 'Seu perfil não possui agenda de prestador.');
        respond($db->rest('GET', 'provider_agenda_events?provider_id=eq.' . rawurlencode($userId) . '&select=*&order=starts_at.asc.nullsfirst', null, $token));
    }

    if ($route === 'payments/service/complete' && $method === 'POST') {
        respond($db->rest('POST', 'rpc/provider_complete_service', ['p_contract_id' => (int) (input()['contract_id'] ?? 0), 'p_actor_id' => $userId], '', true));
    }

    if ($route === 'payments/service/confirm' && $method === 'POST') {
        respond($db->rest('POST', 'rpc/client_confirm_service', ['p_contract_id' => (int) (input()['contract_id'] ?? 0), 'p_actor_id' => $userId], '', true));
    }

    if ($route === 'payments/service/dispute' && $method === 'POST') {
        $data = input();
        respond($db->rest('POST', 'rpc/client_dispute_service', ['p_contract_id' => (int) ($data['contract_id'] ?? 0), 'p_actor_id' => $userId, 'p_reason' => trim((string) ($data['reason'] ?? ''))], '', true));
    }

    if ($route === 'me' && $method === 'GET') {
        respond($me);
    }

    if ($route === 'me' && $method === 'PATCH') {
        $input = input();
        $allowed = ['full_name', 'neighborhood', 'bio', 'service_category', 'company_name', 'avatar_url'];
        $data = array_intersect_key($input, array_flip($allowed));
        if (isset($data['full_name']) && mb_strlen(trim((string) $data['full_name'])) < 2) throw new HttpError(422, 'Nome inválido.');
        $data['updated_at'] = gmdate('c');
        $updated = $db->rest('PATCH', 'profiles?id=eq.' . $userId, $data, $token)[0] ?? $data;
        $private = array_intersect_key($input, array_flip(['phone', 'document']));
        if ($private) $db->rest('PATCH', 'profile_private?user_id=eq.' . $userId, $private, $token);
        respond(array_merge($updated, $private));
    }

    if ($route === 'portfolio' && $method === 'GET') {
        respond($db->rest('GET', 'portfolio_items?owner_id=eq.' . $userId . '&select=*&order=created_at.desc', null, $token));
    }

    if ($route === 'portfolio' && $method === 'POST') {
        if (!Domain::canOfferServices($me['role'])) throw new HttpError(403, 'Seu perfil não possui portfólio.');
        $data = input(); $imageUrl = trim((string) ($data['image_url'] ?? ''));
        if (!filter_var($imageUrl, FILTER_VALIDATE_URL)) throw new HttpError(422, 'Informe uma URL de imagem válida.');
        $row = ['owner_id' => $userId, 'image_url' => $imageUrl, 'description' => trim((string) ($data['description'] ?? '')) ?: null];
        respond($db->rest('POST', 'portfolio_items', [$row], $token)[0] ?? $row, 201);
    }

    if (preg_match('#^portfolio/(\d+)$#', $route, $match) && $method === 'DELETE') {
        if (!Domain::canOfferServices($me['role'])) throw new HttpError(403, 'Seu perfil não possui portfólio.');
        respond($db->rest('DELETE', 'portfolio_items?id=eq.' . $match[1] . '&owner_id=eq.' . $userId, null, $token));
    }

    if ($route === 'finance' && $method === 'GET') {
        if (!Domain::canUseFinance($me['role'])) throw new HttpError(403, 'Seu perfil não possui painel financeiro.');
        respond($db->rest('GET', 'financial_entries?owner_id=eq.' . $userId . '&order=service_date.desc,created_at.desc&select=*', null, $token));
    }

    if ($route === 'finance' && $method === 'POST') {
        if (!Domain::canUseFinance($me['role'])) throw new HttpError(403, 'Seu perfil não possui painel financeiro.');
        $data = input();
        $amount = (float) ($data['amount'] ?? 0);
        if (!Domain::validMoney($amount) || trim((string) ($data['name'] ?? '')) === '') throw new HttpError(422, 'Informe serviço e valor positivo.');
        $row = [
            'owner_id' => $userId,
            'name' => trim((string) $data['name']),
            'category' => trim((string) ($data['category'] ?? '')) ?: null,
            'amount' => $amount,
            'service_date' => (string) ($data['service_date'] ?? gmdate('Y-m-d')),
            'client_name' => trim((string) ($data['client_name'] ?? '')) ?: null,
            'status' => (string) ($data['status'] ?? 'Concluído'),
            'notes' => trim((string) ($data['notes'] ?? '')) ?: null,
            'source' => 'manual',
        ];
        respond($db->rest('POST', 'financial_entries', [$row], $token)[0] ?? $row, 201);
    }

    if ($route === 'finance/goal' && $method === 'GET') {
        if (!Domain::canUseFinance($me['role'])) throw new HttpError(403, 'Seu perfil não possui painel financeiro.');
        $month = gmdate('Y-m-01');
        $rows = $db->rest('GET', 'monthly_goals?owner_id=eq.' . $userId . '&month=eq.' . $month . '&select=amount', null, $token);
        respond(['amount' => isset($rows[0]['amount']) ? (float) $rows[0]['amount'] : 0]);
    }

    if ($route === 'finance/goal' && in_array($method, ['POST', 'PATCH'], true)) {
        if (!Domain::canUseFinance($me['role'])) throw new HttpError(403, 'Seu perfil não possui painel financeiro.');
        $amount = (float) (input()['amount'] ?? -1);
        if (!is_finite($amount) || $amount < 0) throw new HttpError(422, 'Meta mensal inválida.');
        $month = gmdate('Y-m-01');
        $path = 'monthly_goals?owner_id=eq.' . $userId . '&month=eq.' . $month;
        if ($amount === 0.0) {
            $db->rest('DELETE', $path, null, $token);
            respond(['amount' => 0]);
        }
        $existing = $db->rest('GET', $path . '&select=owner_id', null, $token);
        $row = ['owner_id' => $userId, 'month' => $month, 'amount' => $amount];
        $rows = isset($existing[0]) ? $db->rest('PATCH', $path, ['amount' => $amount], $token)
            : $db->rest('POST', 'monthly_goals', [$row], $token);
        respond($rows[0] ?? $row);
    }

    if (preg_match('#^finance/(\d+)$#', $route, $match) && in_array($method, ['PATCH', 'DELETE'], true)) {
        if (!Domain::canUseFinance($me['role'])) throw new HttpError(403, 'Seu perfil não possui painel financeiro.');
        $path = 'financial_entries?id=eq.' . $match[1] . '&owner_id=eq.' . $userId . '&source=eq.manual';
        if ($method === 'DELETE') respond($db->rest('DELETE', $path, null, $token));
        $data = input();
        unset($data['id'], $data['owner_id'], $data['contract_id'], $data['source'], $data['created_at']);
        if (isset($data['amount']) && !Domain::validMoney((float) $data['amount'])) throw new HttpError(422, 'Valor inválido.');
        $data['updated_at'] = gmdate('c');
        respond($db->rest('PATCH', $path, $data, $token));
    }

    if ($route === 'conversations' && $method === 'GET') {
        respond($db->rest('GET', 'conversations?or=(client_id.eq.' . $userId . ',provider_id.eq.' . $userId . ')&select=*,client:profiles!conversations_client_id_fkey(id,full_name,avatar_url),provider:profiles!conversations_provider_id_fkey(id,full_name,avatar_url)&order=updated_at.desc', null, $token));
    }

    if ($route === 'conversations' && $method === 'POST') {
        $data = input();
        $providerId = (string) ($data['provider_id'] ?? '');
        if ($providerId === '' || $providerId === $userId) throw new HttpError(422, 'Prestador inválido.');
        $existing = $db->rest('GET', 'conversations?client_id=eq.' . $userId . '&provider_id=eq.' . rawurlencode($providerId) . '&select=*', null, $token);
        if (isset($existing[0])) respond($existing[0]);
        $rows = $db->rest('POST', 'conversations', [[ 'client_id' => $userId, 'provider_id' => $providerId ]], $token);
        respond($rows[0] ?? [], 201);
    }

    if ($route === 'messages' && $method === 'GET') {
        $conversationId = (int) query('conversation_id');
        $messages = $db->rest('GET', 'messages?conversation_id=eq.' . $conversationId . '&select=*&order=created_at.asc', null, $token);
        foreach ($messages as &$message) {
            if (!empty($message['attachment_path'])) {
                try {
                    $signed = $db->storage('POST', 'object/sign/chat-attachments/' . $message['attachment_path'], ['expiresIn' => 604800], $token);
                    $signedPath = (string) ($signed['signedURL'] ?? '');
                    if ($signedPath === '') throw new HttpError(404, 'Anexo indisponível.');
                    $message['attachment_url'] = rtrim(Config::get('SUPABASE_URL'), '/') . '/storage/v1' . $signedPath;
                } catch (Throwable) {
                    $message['attachment_error'] = true;
                }
            }
        }
        unset($message);
        respond($messages);
    }

    if ($route === 'messages' && $method === 'POST') {
        $data = input();
        $body = trim((string) ($data['body'] ?? ''));
        $attachmentPath = trim((string) ($data['attachment_path'] ?? ''));
        $conversationId = (int) ($data['conversation_id'] ?? 0);
        $attachmentName = trim((string) ($data['attachment_name'] ?? ''));
        $attachmentMime = strtolower(trim((string) ($data['attachment_mime'] ?? '')));
        $allowedAttachmentTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip', 'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav',
        ];
        if ($conversationId < 1 || ($body === '' && $attachmentPath === '') || mb_strlen($body) > 4000) throw new HttpError(422, 'Mensagem inválida.');
        if ($attachmentPath !== '' && (!preg_match('#^' . $conversationId . '/[a-zA-Z0-9-]+\.[a-zA-Z0-9]{1,8}$#', $attachmentPath) || $attachmentName === '' || mb_strlen($attachmentName) > 180 || !in_array($attachmentMime, $allowedAttachmentTypes, true))) throw new HttpError(422, 'Anexo inválido.');
        $row = [ 'conversation_id' => $conversationId, 'sender_id' => $userId, 'body' => $body, 'attachment_path' => $attachmentPath ?: null, 'attachment_name' => $attachmentPath !== '' ? $attachmentName : null, 'attachment_mime' => $attachmentPath !== '' ? $attachmentMime : null ];
        $rows = $db->rest('POST', 'messages', [$row], $token);
        respond($rows[0] ?? [], 201);
    }

    if ($route === 'contracts' && $method === 'POST') {
        if (!Domain::canOfferServices($me['role'])) throw new HttpError(403, 'Somente prestadores podem criar propostas.');
        $data = input();
        $amount = (float) ($data['amount'] ?? 0);
        if (!Domain::validMoney($amount)) throw new HttpError(422, 'Valor da proposta inválido.');
        $row = $db->rest('POST', 'rpc/create_contract_with_schedule', [
            'p_conversation_id' => (int) ($data['conversation_id'] ?? 0),
            'p_description' => trim((string) ($data['description'] ?? '')),
            'p_amount' => $amount,
            'p_actor_id' => $userId,
            'p_scheduled_at' => !empty($data['service_scheduled_at']) ? (string) $data['service_scheduled_at'] : null,
            'p_duration_minutes' => isset($data['service_duration_minutes']) && $data['service_duration_minutes'] !== '' ? (int) $data['service_duration_minutes'] : null,
            'p_location' => trim((string) ($data['service_location'] ?? '')) ?: null,
        ], '', true);
        respond($row, 201);
    }

    if ($route === 'contracts' && $method === 'GET') {
        $conversationId = (int) query('conversation_id');
        $providerId = query('provider_id');
        $filter = $conversationId > 0 ? 'conversation_id=eq.' . $conversationId : 'provider_id=eq.' . rawurlencode($providerId) . '&buyer_id=eq.' . $userId;
        respond($db->rest('GET', 'contracts?' . $filter . '&select=*&order=created_at.desc', null, $token));
    }

    if ($route === 'payments/checkout' && $method === 'POST') {
        $contractId = (int) (input()['contract_id'] ?? 0);
        $contract = $db->rest('POST', 'rpc/begin_checkout', ['p_contract_id' => $contractId], $token);
        if (isset($contract[0]) && is_array($contract[0])) $contract = $contract[0];
        $baseUrl = rtrim(Config::get('APP_URL'), '/');
        if (Config::get('ABACATEPAY_API_KEY', false) !== '') {
            $checkoutProductExternalId = 'nexlar-contract-' . $contractId;
            $product = abacatePay('GET', '/products/get?externalId=' . rawurlencode($checkoutProductExternalId), null, null, true);
            if (empty($product['id'])) {
                $product = abacatePay('POST', '/products/create', [
                    'externalId' => $checkoutProductExternalId,
                    'name' => $contract['description'],
                    'description' => 'Serviço contratado pela Nexlar',
                    'price' => (int) round(((float) $contract['amount']) * 100),
                    'currency' => 'BRL',
                ], 'nexlar-product-' . $contractId . '-' . (int) round(((float) $contract['amount']) * 100));
            }
            $checkout = abacatePay('POST', '/checkouts/create', [
                'items' => [[ 'id' => $product['id'], 'quantity' => 1 ]],
                'methods' => ['PIX', 'CARD'],
                'externalId' => 'nexlar-contract-' . $contractId,
                'returnUrl' => "$baseUrl/src/pages/painelmensagens.html?payment=pending",
                'completionUrl' => "$baseUrl/src/pages/painelmensagens.html?payment=success",
                'metadata' => ['contract_id' => (string) $contractId],
            ], 'nexlar-checkout-' . $contractId);
            if (empty($checkout['url']) || empty($checkout['id'])) throw new HttpError(502, 'A AbacatePay não retornou um link de pagamento válido.');
            $db->rest('POST', 'rpc/attach_abacate_checkout', ['p_contract_id' => $contractId, 'p_checkout_id' => (string) ($checkout['id'] ?? '')], $token);
            respond(['checkout_url' => $checkout['url'] ?? null]);
        }
        try {
            $preferenceId = (string) ($contract['mercado_pago_preference_id'] ?? '');
            if ($preferenceId !== '') {
                $preference = mercadoPago('GET', '/checkout/preferences/' . rawurlencode($preferenceId));
                respond([ 'checkout_url' => $preference['init_point'] ?? $preference['sandbox_init_point'] ?? null ]);
            }
            $preference = mercadoPago('POST', '/checkout/preferences', [
                'items' => [[ 'title' => $contract['description'], 'quantity' => 1, 'currency_id' => 'BRL', 'unit_price' => (float) $contract['amount'] ]],
                'external_reference' => (string) $contractId,
                'back_urls' => [ 'success' => "$baseUrl/src/pages/painelmensagens.html?payment=success", 'pending' => "$baseUrl/src/pages/painelmensagens.html?payment=pending", 'failure' => "$baseUrl/src/pages/painelmensagens.html?payment=failure" ],
                'auto_return' => 'approved',
                'notification_url' => "$baseUrl/api/index.php?route=payments/webhook",
            ], 'nexlar-contract-' . $contractId);
            $db->rest('POST', 'rpc/attach_checkout', ['p_contract_id' => $contractId, 'p_preference_id' => $preference['id']], $token);
        } catch (Throwable $error) {
            $db->rest('POST', 'rpc/reset_checkout', ['p_contract_id' => $contractId], $token);
            throw $error;
        }
        respond([ 'checkout_url' => $preference['init_point'] ?? $preference['sandbox_init_point'] ?? null ]);
    }

    if (preg_match('#^contracts/(\d+)/status$#', $route, $match) && $method === 'POST') {
        $status = (string) (input()['status'] ?? '');
        if ($status !== 'em_andamento') throw new HttpError(422, 'Concluir o serviço requer a etapa de confirmação do cliente.');
        respond($db->rest('POST', 'rpc/transition_contract', ['p_contract_id' => (int) $match[1], 'p_status' => $status, 'p_actor_id' => $userId], '', true));
    }

    if ($route === 'reviews' && $method === 'POST') {
        $data = input();
        $contractId = (int) ($data['contract_id'] ?? 0);
        $rating = (int) ($data['rating'] ?? 0);
        if ($rating < 1 || $rating > 5) throw new HttpError(422, 'A nota deve estar entre 1 e 5.');
        $contracts = $db->rest('GET', 'contracts?id=eq.' . $contractId . '&select=*', null, $token);
        $contract = $contracts[0] ?? null;
        if (!$contract || $contract['buyer_id'] !== $userId || $contract['status'] !== 'concluido') throw new HttpError(403, 'Esta contratação ainda não pode ser avaliada.');
        $row = [ 'contract_id' => $contractId, 'reviewer_id' => $userId, 'provider_id' => $contract['provider_id'], 'rating' => $rating, 'comment' => trim((string) ($data['comment'] ?? '')) ?: null ];
        respond($db->rest('POST', 'reviews', [$row], $token)[0] ?? $row, 201);
    }

    throw new HttpError(404, 'Rota não encontrada.');
} catch (HttpError $error) {
    respond(['error' => $error->getMessage()], $error->status);
} catch (Throwable $error) {
    error_log($error->getMessage());
    respond(['error' => 'Erro interno do servidor.'], 500);
}




