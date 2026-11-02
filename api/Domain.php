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

    public static function validPortfolioImages(array $images, string $userId, string $supabaseUrl, array $legacyImages = []): bool
    {
        if (count($images) < 1 || count($images) > 5) {
            return false;
        }

        $paths = [];
        foreach ($images as $image) {
            if (!is_array($image) || !isset($image['image_url'])) {
                return false;
            }
            if (isset($image['storage_path'])) {
                if (!self::validPortfolioImage((string) $image['image_url'], (string) $image['storage_path'], $userId, $supabaseUrl)
                    || in_array($image['storage_path'], $paths, true)) {
                    return false;
                }
                $paths[] = $image['storage_path'];
                continue;
            }
            $retainsLegacyImage = false;
            foreach ($legacyImages as $legacy) {
                if (($legacy['image_url'] ?? null) === $image['image_url'] && empty($legacy['storage_path'])) {
                    $retainsLegacyImage = true;
                    break;
                }
            }
            if (!$retainsLegacyImage) {
                return false;
            }
        }

        return true;
    }

    public static function validPortfolioOffer(string $title, string $priceMode, mixed $price, string $description, string $duration): bool
    {
        if (mb_strlen(trim($title)) < 2 || mb_strlen(trim($title)) > 90
            || mb_strlen($description) > 1000 || mb_strlen($duration) > 80
            || !in_array($priceMode, ['fixo', 'a_partir_de', 'sob_consulta'], true)) {
            return false;
        }

        if ($priceMode === 'sob_consulta') {
            return $price === null || $price === '';
        }

        return is_numeric($price) && self::validMoney((float) $price) && (float) $price <= 1000000;
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



