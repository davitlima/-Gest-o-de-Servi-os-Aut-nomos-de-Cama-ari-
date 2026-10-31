<?php

declare(strict_types=1);

namespace Nexlar;

final class Domain
{
    public static function canOfferServices(string $role): bool
    {
        return in_array($role, ['autonomo', 'empresa'], true);
    }

    public static function canUseFinance(string $role): bool
    {
        return self::canOfferServices($role);
    }

    public static function validMoney(float|int $value): bool
    {
        return is_finite((float) $value) && $value > 0;
    }

    public static function platformFee(float|int $amount): float
    {
        return round((float) $amount * 0.15, 2);
    }

    public static function providerNet(float|int $amount): float
    {
        return round((float) $amount - self::platformFee($amount), 2);
    }

    public static function canTransitionContract(string $from, string $to): bool
    {
        return in_array("$from:$to", [
            'proposta:aguardando_pagamento',
            'aguardando_pagamento:pago',
            'aguardando_pagamento:recusado',
            'pago:em_andamento',
            'em_andamento:concluido',
            'proposta:cancelado',
        ], true);
    }

    public static function canReview(string $contractStatus, bool $alreadyReviewed): bool
    {
        return $contractStatus === 'concluido' && !$alreadyReviewed;
    }

    public static function jwtAssuranceLevel(string $token): ?string
    {
        $decoded = self::jwtPayload($token);
        return is_string($decoded['aal'] ?? null) ? $decoded['aal'] : null;
    }

    public static function jwtSessionId(string $token): ?string
    {
        $value = self::jwtPayload($token)['session_id'] ?? null;
        return is_string($value) && $value !== '' ? $value : null;
    }

    public static function jwtUserId(string $token): ?string
    {
        $value = self::jwtPayload($token)['sub'] ?? null;
        return is_string($value) && $value !== '' ? $value : null;
    }

    public static function jwtExpiresAt(string $token): ?int
    {
        $value = self::jwtPayload($token)['exp'] ?? null;
        return is_int($value) ? $value : null;
    }

    public static function jwtHasAuthenticationMethod(string $token, string $method): bool
    {
        foreach (self::jwtPayload($token)['amr'] ?? [] as $entry) {
            if (is_array($entry) && ($entry['method'] ?? null) === $method) return true;
        }
        return false;
    }

    public static function jwtAuthenticationMethodIsRecent(string $token, string $method, int $maxAgeSeconds, ?int $now = null): bool
    {
        $now ??= time();
        foreach (self::jwtPayload($token)['amr'] ?? [] as $entry) {
            if (!is_array($entry) || ($entry['method'] ?? null) !== $method) continue;
            $timestamp = $entry['timestamp'] ?? null;
            return is_int($timestamp) && $timestamp <= $now && ($now - $timestamp) <= $maxAgeSeconds;
        }
        return false;
    }

    private static function jwtPayload(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return [];
        $payload = strtr($parts[1], '-_', '+/');
        $payload .= str_repeat('=', (4 - strlen($payload) % 4) % 4);
        $decoded = json_decode((string) base64_decode($payload, true), true);
        return is_array($decoded) ? $decoded : [];
    }
}



