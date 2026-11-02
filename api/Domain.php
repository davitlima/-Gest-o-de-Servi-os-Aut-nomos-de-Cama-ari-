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

    public static function validPortfolioImage(string $imageUrl, string $storagePath, string $userId, string $supabaseUrl): bool
    {
        $pathPattern = '#^' . preg_quote($userId, '#') . '/portfolio/[A-Za-z0-9][A-Za-z0-9._-]*$#D';
        if (!preg_match($pathPattern, $storagePath) || filter_var($imageUrl, FILTER_VALIDATE_URL) === false) {
            return false;
        }

        $expectedUrl = rtrim($supabaseUrl, '/') . '/storage/v1/object/public/avatars/' . $storagePath;
        return hash_equals($expectedUrl, $imageUrl);
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

}



