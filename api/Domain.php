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
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        $payload = strtr($parts[1], '-_', '+/');
        $payload .= str_repeat('=', (4 - strlen($payload) % 4) % 4);
        $decoded = json_decode((string) base64_decode($payload, true), true);
        return is_array($decoded) && is_string($decoded['aal'] ?? null) ? $decoded['aal'] : null;
    }
}
