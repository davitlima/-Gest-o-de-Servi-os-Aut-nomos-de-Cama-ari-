<?php

declare(strict_types=1);

namespace Nexlar\Mvc;

final class Page
{
    private const PAGES = [
        'inicio' => 'src/pages/inicio.html',
        'login' => 'src/pages/login.html',
        'cadastro' => 'src/pages/cadastro.html',
        'cadastrocliente' => 'src/pages/cadastrocliente.html',
        'cadastroautonomo' => 'src/pages/cadastroautonomo.html',
        'cadastroempresa' => 'src/pages/cadastroempresa.html',
        'perfilAutonomo' => 'src/pages/perfilAutonomo.html',
        'Meuperfil' => 'src/pages/Meuperfil.html',
        'Painelfinanceiro' => 'src/pages/Painelfinanceiro.html',
        'painelmensagens' => 'src/pages/painelmensagens.html',
        'lgpd' => 'src/pages/lgpd.html',
    ];

    public static function path(string $page): ?string
    {
        $relative = self::PAGES[$page] ?? null;
        return $relative === null ? null : dirname(__DIR__) . '/' . $relative;
    }

    public static function exists(string $page): bool
    {
        $path = self::path($page);
        return $path !== null && is_file($path);
    }
}

