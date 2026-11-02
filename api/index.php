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
    $private = $db->rest('GET', 'profile_private?user_id=eq.' . rawurlencode($userId) . '&select=phone,document', null, $token);
    return array_merge($rows[0], $private[0] ?? ['phone' => null, 'document' => null]);
}

function portfolioInputImages(array $data): array
{
    if (isset($data['images']) && is_array($data['images'])) {
        return array_values(array_map(static fn (array $image): array => [
            'image_url' => trim((string) ($image['image_url'] ?? '')),
            'storage_path' => isset($image['storage_path']) ? trim((string) $image['storage_path']) : null,
        ], array_filter($data['images'], 'is_array')));
    }
    if (isset($data['image_url'], $data['storage_path'])) {
        return [[
            'image_url' => trim((string) $data['image_url']),
            'storage_path' => trim((string) $data['storage_path']),
        ]];
    }
    return [];
}

function portfolioRpcResult(array $response, string $function): array
{
    $result = $response[0][$function] ?? $response[$function] ?? $response[0] ?? $response;
    if (!is_array($result)) {
        throw new HttpError(502, 'Não foi possível salvar a oferta.');
    }
    return $result;
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
        $profiles = $db->rest('GET', 'profiles?id=eq.' . rawurlencode($profileId) . '&select=id,role,full_name,neighborhood,bio,service_category,avatar_url,company_name,portfolio_items(*,portfolio_item_images(id,image_url,storage_path,position,created_at)),reviews!reviews_provider_id_fkey(contract_id,rating,comment,created_at,reviewer:profiles!reviews_reviewer_id_fkey(full_name,avatar_url))&portfolio_items.portfolio_item_images.order=position.asc', null, Config::get('SUPABASE_PUBLISHABLE_KEY'));
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

    $token = bearer();
    $user = $db->user($token);
    $userId = (string) ($user['id'] ?? '');
    if ($userId === '') {
        throw new HttpError(401, 'Sessão inválida.');
    }
    $me = profile($db, $token, $userId);

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

    if ($route === 'account' && $method === 'DELETE') {
        $confirmation = (string) (input()['confirmation'] ?? '');
        $db->rest('POST', 'rpc/delete_own_account', ['p_confirmation' => $confirmation], $token);
        respond(['deleted' => true]);
    }

    if ($route === 'portfolio' && $method === 'GET') {
        respond($db->rest('GET', 'portfolio_items?owner_id=eq.' . $userId . '&select=*,portfolio_item_images(id,image_url,storage_path,position,created_at)&portfolio_item_images.order=position.asc&order=created_at.desc', null, $token));
    }

    if ($route === 'portfolio' && $method === 'POST') {
        if (!Domain::canOfferServices($me['role'])) throw new HttpError(403, 'Seu perfil não possui portfólio.');
        $data = input();
        $images = portfolioInputImages($data);
        $description = trim((string) ($data['description'] ?? ''));
        if (!Domain::validPortfolioImages($images, $userId, Config::get('SUPABASE_URL'))) throw new HttpError(422, 'Adicione de uma a cinco imagens válidas do seu portfólio.');
        $title = trim((string) ($data['title'] ?? ''));
        $priceMode = (string) ($data['price_mode'] ?? '');
        $price = $data['price'] ?? null;
        $duration = trim((string) ($data['estimated_duration'] ?? ''));
        if (!Domain::validPortfolioOffer($title, $priceMode, $price, $description, $duration)) throw new HttpError(422, 'Revise o nome, descrição, preço e prazo da oferta.');
        if ($priceMode === 'sob_consulta') $price = null;
        $result = $db->rest('POST', 'rpc/create_portfolio_offer', [
            'p_title' => $title,
            'p_description' => $description,
            'p_price_mode' => $priceMode,
            'p_price' => $price === null ? null : (float) $price,
            'p_estimated_duration' => $duration,
            'p_images' => $images,
        ], $token);
        respond(portfolioRpcResult($result, 'create_portfolio_offer'), 201);
    }

    if (preg_match('#^portfolio/(\d+)$#', $route, $match) && $method === 'PATCH') {
        if (!Domain::canOfferServices($me['role'])) throw new HttpError(403, 'Seu perfil não possui portfólio.');
        $data = input();
        $existingRows = $db->rest('GET', 'portfolio_items?id=eq.' . $match[1] . '&owner_id=eq.' . $userId . '&select=*,portfolio_item_images(id,image_url,storage_path,position,created_at)&portfolio_item_images.order=position.asc', null, $token);
        $existing = $existingRows[0] ?? null;
        if (!$existing) throw new HttpError(404, 'Oferta não encontrada.');
        $title = trim((string) ($data['title'] ?? $existing['title'] ?? ''));
        $description = trim((string) ($data['description'] ?? $existing['description'] ?? ''));
        $priceMode = (string) ($data['price_mode'] ?? $existing['price_mode'] ?? '');
        $price = array_key_exists('price', $data) ? $data['price'] : ($existing['price'] ?? null);
        $duration = trim((string) ($data['estimated_duration'] ?? $existing['estimated_duration'] ?? ''));
        if (!Domain::validPortfolioOffer($title, $priceMode, $price, $description, $duration)) throw new HttpError(422, 'Revise o nome, descrição, preço e prazo da oferta.');
        if ($priceMode === 'sob_consulta') $price = null;
        $hasImages = array_key_exists('images', $data) || array_key_exists('image_url', $data) || array_key_exists('storage_path', $data);
        if ($hasImages) {
            $images = portfolioInputImages($data);
            $legacyImages = $existing['portfolio_item_images'] ?? [];
            if (!$legacyImages && !empty($existing['image_url'])) {
                $legacyImages[] = ['image_url' => $existing['image_url'], 'storage_path' => $existing['storage_path'] ?? null];
            }
            if (!Domain::validPortfolioImages($images, $userId, Config::get('SUPABASE_URL'), $legacyImages)) throw new HttpError(422, 'Revise as imagens da oferta.');
            $result = $db->rest('POST', 'rpc/replace_portfolio_offer', [
                'p_id' => (int) $match[1],
                'p_title' => $title,
                'p_description' => $description,
                'p_price_mode' => $priceMode,
                'p_price' => $price === null ? null : (float) $price,
                'p_estimated_duration' => $duration,
                'p_images' => $images,
            ], $token);
            respond(portfolioRpcResult($result, 'replace_portfolio_offer'));
        }
        $row = ['title' => $title, 'description' => $description ?: null, 'price_mode' => $priceMode, 'price' => $price === null ? null : (float) $price, 'estimated_duration' => $duration ?: null];
        $updated = $db->rest('PATCH', 'portfolio_items?id=eq.' . $match[1] . '&owner_id=eq.' . $userId, $row, $token);
        if (!isset($updated[0])) throw new HttpError(404, 'Oferta não encontrada.');
        respond($updated[0]);
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
        respond($db->rest('GET', 'messages?conversation_id=eq.' . $conversationId . '&select=*&order=created_at.asc', null, $token));
    }

    if ($route === 'messages' && $method === 'POST') {
        $data = input();
        $body = trim((string) ($data['body'] ?? ''));
        if ($body === '' || mb_strlen($body) > 4000) throw new HttpError(422, 'Mensagem inválida.');
        $rows = $db->rest('POST', 'messages', [[ 'conversation_id' => (int) ($data['conversation_id'] ?? 0), 'sender_id' => $userId, 'body' => $body ]], $token);
        respond($rows[0] ?? [], 201);
    }

    if ($route === 'contracts' && $method === 'POST') {
        if (!Domain::canOfferServices($me['role'])) throw new HttpError(403, 'Somente prestadores podem criar propostas.');
        $data = input();
        $amount = (float) ($data['amount'] ?? 0);
        if (!Domain::validMoney($amount)) throw new HttpError(422, 'Valor da proposta inválido.');
        $row = $db->rest('POST', 'rpc/create_contract', [
            'p_conversation_id' => (int) ($data['conversation_id'] ?? 0),
            'p_description' => trim((string) ($data['description'] ?? '')),
            'p_amount' => $amount,
        ], $token);
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
        if (!in_array($status, ['em_andamento', 'concluido'], true)) throw new HttpError(422, 'Status inválido.');
        respond($db->rest('POST', 'rpc/transition_contract', ['p_contract_id' => (int) $match[1], 'p_status' => $status], $token));
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



