<?php

declare(strict_types=1);

namespace Nexlar\Mvc;

final class Page
{
    private const PAGES = [
        'inicio' => 'src/pages/inicio.html',
        'login' => 'View/auth/login.php',
        'cadastro' => 'View/auth/register-choice.php',
        'cadastrocliente' => 'View/auth/register-cliente.php',
        'cadastroautonomo' => 'View/auth/register-autonomo.php',
        'cadastroempresa' => 'View/auth/register-empresa.php',
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

