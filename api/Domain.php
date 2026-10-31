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

}



