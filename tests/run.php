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
expect(is_file($root . '/index.php'), 'Front controller MVC deve existir na dev');
expect(is_file($root . '/api/page.php'), 'Front controller PHP deve estar disponível em api/');
expect(is_file($root . '/Controller/PageController.php'), 'Controller MVC deve existir na dev');
expect(is_file($root . '/Model/Page.php'), 'Model MVC deve existir na dev');
expect(is_file($root . '/View/page.php'), 'View MVC deve existir na dev');
expect(is_file($root . '/src/pages/cadastro.html'), 'URL antiga de cadastro deve continuar funcionando');
expect(is_file($root . '/supabase/migrations/20261030213215_nexlar_backend.sql'), 'Migração Supabase deve existir na dev');

$vercel = json_decode((string) file_get_contents($root . '/vercel.json'), true, 512, JSON_THROW_ON_ERROR);
expect(isset($vercel['functions']['api/page.php']), 'Front controller deve usar runtime PHP na Vercel');
expect(count($vercel['rewrites'] ?? []) >= 20, 'Páginas públicas devem ser roteadas pelo MVC');

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
$lgpdCss = file_get_contents($root . '/src/css/lgpd.css');
expect(substr_count($lgpdCss, '{') === substr_count($lgpdCss, '}'), 'CSS da LGPD deve ter blocos balanceados');
$lgpdHtml = file_get_contents($root . '/src/pages/lgpd.html');
expect(str_contains($lgpdHtml, 'id="btn-home"'), 'LGPD deve manter o botão de retorno ao início');
$lgpdJs = file_get_contents($root . '/src/js/lgpd.js');
expect(str_contains($lgpdJs, "location.href = '/src/pages/inicio.html'"), 'Botão de retorno deve navegar para o início');

$publicProfileJs = file_get_contents($root . '/src/js/perfilAutonomo.js');
expect(str_contains($publicProfileJs, 'let profile = null;'), 'Perfil público deve manter o perfil carregado disponível para a avaliação');
expect(!str_contains($publicProfileJs, 'const profile = await'), 'Perfil público não pode limitar o perfil ao bloco de carregamento');
expect(str_contains($publicProfileJs, "api.request('reviews'"), 'Perfil público deve enviar a avaliação pela API');

$authJs = file_get_contents($root . '/src/js/auth.js');
expect(str_contains($authJs, '(?=.*\\d)'), 'Senha deve exigir um dígito real');
expect(str_contains($authJs, 'replace(/\\D/g'), 'CPF/CNPJ deve remover caracteres não numéricos');
expect(!str_contains($authJs, '(?=.*\\\\d)'), 'Regex de senha não pode procurar o texto literal \\d');
expect(!str_contains($authJs, "type: 'signup'"), 'Login não deve reenviar confirmação de e-mail');
expect(str_contains($authJs, 'supabase.auth.signOut()'), 'Cadastro deve encerrar a sessão automática antes do login');
expect(!str_contains($authJs, 'startEmailStep'), 'Login não deve iniciar segunda etapa por e-mail');
expect(!str_contains($authJs, 'mfa.enroll'), 'Login não deve cadastrar aplicativo autenticador');
expect(str_contains($authJs, 'window.nexlar'), 'Login deve usar a API global publicada pelo cliente');
expect(!str_contains($authJs, 'window.nexlarApi'), 'Login não pode usar uma API global inexistente');

$authCss = file_get_contents($root . '/src/css/auth.css');
expect(!str_contains($authCss, '.email-step'), 'CSS não deve manter a segunda etapa por e-mail');

$migration = file_get_contents($root . '/supabase/migrations/20261030213215_nexlar_backend.sql');
$api = file_get_contents($root . '/api/index.php');
expect(str_contains($api, 'api.abacatepay.com/v2'), 'API deve integrar o endpoint oficial da AbacatePay');
expect(str_contains($api, 'payments/abacatepay/webhook'), 'API deve expor webhook da AbacatePay');
expect(str_contains($api, 'ABACATEPAY_API_KEY'), 'Chave AbacatePay deve vir do ambiente');
expect(is_file($root . '/supabase/migrations/20261110170000_abacatepay.sql'), 'Migração AbacatePay deve existir');
expect(str_contains($migration, 'month date not null'), 'Meta mensal usa uma data de referência');
expect(!str_contains($api, 'monthly_goals?owner_id=eq.$userId&year='), 'API não pode consultar colunas inexistentes de meta');
expect(!str_contains($api, "auth/email-step/start"), 'API não deve exigir segunda etapa por e-mail');
expect(!str_contains($api, "auth/email-step/complete"), 'API não deve concluir segunda etapa por e-mail');

$chatHtml = file_get_contents($root . '/src/pages/painelmensagens.html');
expect(!str_contains($chatHtml, '>Online<'), 'Chat não pode simular presença online');
expect(substr_count($chatHtml, '/src/js/api.js') === 1, 'Chat deve carregar o cliente de API uma única vez');
expect(str_contains($chatHtml, 'id="connectionStatus"'), 'Chat deve comunicar o estado da conexão em tempo real');
$chatJs = file_get_contents($root . '/src/js/painelmensagens.js');
expect(!str_contains($chatJs, 'setInterval('), 'Fallback do chat não pode sobrepor requisições lentas');
expect(str_contains($chatJs, 'isCurrentOpen'), 'Troca rápida de conversa deve invalidar carregamentos antigos');
expect(!str_contains($chatJs, "[data-page=\"financeiro\"]')?.remove()"), 'Mensagens não deve remover o Financeiro da navegação');

$responsiveCss = file_get_contents($root . '/src/css/responsive.css');
expect(str_contains($responsiveCss, 'env(safe-area-inset-bottom'), 'Layout móvel deve respeitar a safe area inferior');
expect(str_contains($responsiveCss, 'env(safe-area-inset-top'), 'Chat móvel deve respeitar a safe area superior');
expect(str_contains($responsiveCss, 'min-height: 44px'), 'Controles móveis devem ter alvo de toque mínimo');

$financeCss = file_get_contents($root . '/src/css/Painelfinanceiro.css');
expect(str_contains($financeCss, '.goal-editor-controls'), 'Editor de meta precisa de layout responsivo próprio');

foreach (['Meuperfil' => 'perfil', 'Painelfinanceiro' => 'financeiro', 'painelmensagens' => 'mensagens'] as $page => $active) {
    $html = file_get_contents($root . '/src/pages/' . $page . '.html');
    expect(substr_count($html, '<nexlar-panel-nav ') === 1, $page . ' deve usar uma única navegação compartilhada');
    expect(str_contains($html, '<nexlar-panel-nav active="' . $active . '"></nexlar-panel-nav>'), $page . ' deve informar a rota ativa correta');
    expect(substr_count($html, '/src/css/panel-nav.css') === 1, $page . ' deve carregar o CSS compartilhado uma única vez');
    expect(substr_count($html, '/src/js/panel-nav.js') === 1, $page . ' deve carregar o componente uma única vez');
    expect(strpos($html, '/src/css/panel-nav.css') < strpos($html, '<script'), $page . ' deve agrupar os estilos antes dos scripts');
    expect(strpos($html, '/src/js/panel-nav.js') < strpos($html, '/src/js/' . $page . '.js'), $page . ' deve carregar a navegação antes do script da página');
    expect(!preg_match('/<aside\b|id="(?:financeSidebar|financeOverlay|financeMenuButton|sidebarClose|hamburger|overlay)"/', $html), $page . ' não deve duplicar o drawer');
    $css = file_get_contents($root . '/src/css/' . $page . '.css');
    expect(!preg_match('/\.(?:sidebar|nav-link|nav-item|hamburger|menu-toggle|finance-overlay)\b/', $css), $page . ' não deve duplicar estilos da navegação');
    expect(substr_count($css, '{') === substr_count($css, '}'), $page . ' deve manter o CSS balanceado');
    $js = file_get_contents($root . '/src/js/' . $page . '.js');
    expect(!preg_match('/financeSidebar|financeOverlay|financeMenuButton|definirEstadoMenuFinanceiro|financeNav|sidebarClose|hamburger|drawer-open/', $js), $page . ' não deve controlar nem ocultar a navegação compartilhada');
}

$clientSignup = file_get_contents($root . '/src/pages/cadastrocliente.html');
expect(substr_count($clientSignup, 'vlibras-plugin.js') === 1, 'Cadastro de cliente deve carregar VLibras uma única vez');
expect(str_contains($clientSignup, 'aria-label="CPF"'), 'Campo CPF precisa de nome acessível');

$realtimeMigrations = glob($root . '/supabase/migrations/*realtime_chat_activity.sql') ?: [];
expect(count($realtimeMigrations) === 1, 'Chat deve possuir migração Realtime versionada');
$realtimeMigration = file_get_contents($realtimeMigrations[0]);
expect(str_contains($realtimeMigration, 'alter publication supabase_realtime add table public.messages'), 'Mensagens devem ser publicadas no Realtime');
expect(str_contains($realtimeMigration, 'update public.conversations'), 'Nova mensagem deve atualizar a atividade da conversa');

$signupChooser = file_get_contents($root . '/src/pages/cadastro.html');
foreach (['cadastrocliente.html', 'cadastroautonomo.html', 'cadastroempresa.html'] as $signupPage) {
    expect(str_contains($signupChooser, $signupPage), 'Seletor de cadastro deve apontar para ' . $signupPage);
}

fwrite(STDOUT, "Todos os testes passaram.\n");


