<?php

declare(strict_types=1);

function expect(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$root = dirname(__DIR__);
expect(is_file($root . '/api/Domain.php'), 'Backend de domínio deve existir na dev');
expect(is_file($root . '/api/index.php'), 'API PHP deve existir na dev');
expect(is_file($root . '/supabase/migrations/20261030213215_nexlar_backend.sql'), 'Migração Supabase deve existir na dev');

require $root . '/api/Domain.php';

use Nexlar\Domain;

expect(Domain::canUseFinance('cliente') === false, 'Cliente não acessa financeiro');
expect(Domain::canUseFinance('autonomo') === true, 'Autônomo acessa financeiro');
expect(Domain::canUseFinance('empresa') === true, 'Empresa acessa financeiro');
expect(Domain::platformFee(100.0) === 15.0, 'Taxa Nexlar deve ser 15%');
expect(Domain::providerNet(100.0) === 85.0, 'Profissional deve receber 85%');

$productionFiles = array_merge(
    glob($root . '/src/pages/*.{html,php}', GLOB_BRACE) ?: [],
    glob($root . '/src/js/*.js') ?: [],
    [$root . '/index.html']
);
$forbiddenMocks = ['Maria Santos', 'Carlos Fabrício', 'Ana Paula', 'Carlos Oliveira', 'João Pedro Silva', 'Rua das Flores, 123'];
foreach ($productionFiles as $file) {
    $source = file_get_contents($file);
    foreach ($forbiddenMocks as $mock) {
        expect(!str_contains($source, $mock), basename($file) . ' contém dado fictício: ' . $mock);
    }
}

$connection = $root . '/Config/Connection.php';
if (is_file($connection)) {
    $source = file_get_contents($connection);
    expect(!preg_match('/\$pass\s*=\s*[\'\"][^\'\"]+[\'\"]/', $source), 'Senha de banco não pode estar no repositório');
}

$homepageCss = file_get_contents($root . '/src/css/homepage.css');
expect(substr_count($homepageCss, '{') === substr_count($homepageCss, '}'), 'CSS da homepage deve ter blocos balanceados');

fwrite(STDOUT, "Todos os testes passaram.\n");
