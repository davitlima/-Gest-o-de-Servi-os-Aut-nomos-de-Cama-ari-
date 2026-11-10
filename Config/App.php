<?php

declare(strict_types=1);

namespace Nexlar\Mvc;

final class App
{
    public static function basePath(): string
    {
        return dirname(__DIR__);
    }

    public static function view(string $name, array $data = []): void
    {
        $path = self::basePath() . '/View/' . $name . '.php';
        if (!is_file($path)) {
            http_response_code(404);
            require self::basePath() . '/View/errors/404.php';
            return;
        }

        extract($data, EXTR_SKIP);
        require $path;
    }
}

