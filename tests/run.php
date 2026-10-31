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
expect(is_file($root . '/src/pages/cadastro.html'), 'URL antiga de cadastro deve continuar funcionando');
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

$authJs = file_get_contents($root . '/src/js/auth.js');
expect(str_contains($authJs, '(?=.*\\d)'), 'Senha deve exigir um dígito real');
expect(str_contains($authJs, 'replace(/\\D/g'), 'CPF/CNPJ deve remover caracteres não numéricos');
expect(!str_contains($authJs, '(?=.*\\\\d)'), 'Regex de senha não pode procurar o texto literal \\d');
expect(str_contains($authJs, "type: 'signup'"), 'Login deve permitir reenviar confirmação de e-mail');
expect(!str_contains($authJs, 'startEmailStep'), 'Login não deve iniciar segunda etapa por e-mail');
expect(!str_contains($authJs, 'mfa.enroll'), 'Login não deve cadastrar aplicativo autenticador');
expect(str_contains($authJs, 'window.nexlar'), 'Login deve usar a API global publicada pelo cliente');
expect(!str_contains($authJs, 'window.nexlarApi'), 'Login não pode usar uma API global inexistente');

$authCss = file_get_contents($root . '/src/css/auth.css');
expect(!str_contains($authCss, '.email-step'), 'CSS não deve manter a segunda etapa por e-mail');

$migration = file_get_contents($root . '/supabase/migrations/20261030213215_nexlar_backend.sql');
$api = file_get_contents($root . '/api/index.php');
expect(str_contains($migration, 'month date not null'), 'Meta mensal usa uma data de referência');
expect(!str_contains($api, 'monthly_goals?owner_id=eq.$userId&year='), 'API não pode consultar colunas inexistentes de meta');
expect(!str_contains($api, "auth/email-step/start"), 'API não deve exigir segunda etapa por e-mail');
expect(!str_contains($api, "auth/email-step/complete"), 'API não deve concluir segunda etapa por e-mail');

$chatHtml = file_get_contents($root . '/src/pages/painelmensagens.html');
expect(!str_contains($chatHtml, '>Online<'), 'Chat não pode simular presença online');

$signupChooser = file_get_contents($root . '/src/pages/cadastro.html');
foreach (['cadastrocliente.html', 'cadastroautonomo.html', 'cadastroempresa.html'] as $signupPage) {
    expect(str_contains($signupChooser, $signupPage), 'Seletor de cadastro deve apontar para ' . $signupPage);
}

fwrite(STDOUT, "Todos os testes passaram.\n");

