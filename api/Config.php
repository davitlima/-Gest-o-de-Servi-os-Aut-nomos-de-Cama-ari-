<?php

declare(strict_types=1);

namespace Nexlar;

final class Config
{
    public static function get(string $name, bool $required = true): string
    {
        $value = getenv($name);
        if (($value === false || $value === '') && $required) {
            throw new \RuntimeException("Variável de ambiente ausente: $name");
        }

        return $value === false ? '' : $value;
    }
}
