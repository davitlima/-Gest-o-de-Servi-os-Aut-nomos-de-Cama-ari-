<?php

declare(strict_types=1);

namespace Nexlar\Mvc;

final class AuthController
{
    public function login(): void { App::view('auth/login'); }
    public function choice(): void { App::view('auth/register-choice'); }
    public function register(string $role): void { App::view('auth/register', ['role' => $role]); }
}

