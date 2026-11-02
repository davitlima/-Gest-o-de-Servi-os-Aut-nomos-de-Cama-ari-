<?php

declare(strict_types=1);

function expect(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$root = dirname(__DIR__);
expect(is_file($root . '/api/Domain.php'), 'Backend de domÃ­nio deve existir na dev');
expect(is_file($root . '/api/index.php'), 'API PHP deve existir na dev');
expect(is_file($root . '/src/pages/cadastro.html'), 'URL antiga de cadastro deve continuar funcionando');
expect(is_file($root . '/supabase/migrations/20261030213215_nexlar_backend.sql'), 'MigraÃ§Ã£o Supabase deve existir na dev');

require $root . '/api/Domain.php';

use Nexlar\Domain;

expect(Domain::canUseFinance('cliente') === false, 'Cliente nÃ£o acessa financeiro');
expect(Domain::canUseFinance('autonomo') === true, 'AutÃ´nomo acessa financeiro');
expect(Domain::canUseFinance('empresa') === true, 'Empresa acessa financeiro');
expect(Domain::platformFee(100.0) === 15.0, 'Taxa Nexlar deve ser 15%');
expect(Domain::providerNet(100.0) === 85.0, 'Profissional deve receber 85%');

$productionFiles = array_merge(
    glob($root . '/src/pages/*.{html,php}', GLOB_BRACE) ?: [],
    glob($root . '/src/js/*.js') ?: [],
    [$root . '/index.html']
);
$forbiddenMocks = ['Maria Santos', 'Carlos FabrÃ­cio', 'Ana Paula', 'Carlos Oliveira', 'JoÃ£o Pedro Silva', 'Rua das Flores, 123'];
foreach ($productionFiles as $file) {
    $source = file_get_contents($file);
    foreach ($forbiddenMocks as $mock) {
        expect(!str_contains($source, $mock), basename($file) . ' contÃ©m dado fictÃ­cio: ' . $mock);
    }
}

$connection = $root . '/Config/Connection.php';
if (is_file($connection)) {
    $source = file_get_contents($connection);
    expect(!preg_match('/\$pass\s*=\s*[\'\"][^\'\"]+[\'\"]/', $source), 'Senha de banco nÃ£o pode estar no repositÃ³rio');
}

$homepageCss = file_get_contents($root . '/src/css/homepage.css');
expect(substr_count($homepageCss, '{') === substr_count($homepageCss, '}'), 'CSS da homepage deve ter blocos balanceados');
$lgpdCss = file_get_contents($root . '/src/css/lgpd.css');
expect(substr_count($lgpdCss, '{') === substr_count($lgpdCss, '}'), 'CSS da LGPD deve ter blocos balanceados');
$lgpdHtml = file_get_contents($root . '/src/pages/lgpd.html');
expect(str_contains($lgpdHtml, 'id="btn-home"'), 'LGPD deve manter o botÃ£o de retorno ao inÃ­cio');
$lgpdJs = file_get_contents($root . '/src/js/lgpd.js');
expect(str_contains($lgpdHtml, 'id="btn-home" href="/"'), 'BotÃ£o de retorno deve navegar para a homepage pÃºblica');

$publicProfileJs = file_get_contents($root . '/src/js/perfilAutonomo.js');
expect(str_contains($publicProfileJs, 'let profile = null;'), 'Perfil pÃºblico deve manter o perfil carregado disponÃ­vel para a avaliaÃ§Ã£o');
expect(!str_contains($publicProfileJs, 'const profile = await'), 'Perfil pÃºblico nÃ£o pode limitar o perfil ao bloco de carregamento');
expect(str_contains($publicProfileJs, "api.request('reviews'"), 'Perfil pÃºblico deve enviar a avaliaÃ§Ã£o pela API');

$authJs = file_get_contents($root . '/src/js/auth.js');
expect(str_contains($authJs, '(?=.*\\d)'), 'Senha deve exigir um dÃ­gito real');
expect(str_contains($authJs, 'replace(/\\D/g'), 'CPF/CNPJ deve remover caracteres nÃ£o numÃ©ricos');
expect(!str_contains($authJs, '(?=.*\\\\d)'), 'Regex de senha nÃ£o pode procurar o texto literal \\d');
expect(!str_contains($authJs, "type: 'signup'"), 'Login nÃ£o deve reenviar confirmaÃ§Ã£o de e-mail');
expect(str_contains($authJs, 'supabase.auth.signOut()'), 'Cadastro deve encerrar a sessÃ£o automÃ¡tica antes do login');
expect(!str_contains($authJs, 'startEmailStep'), 'Login nÃ£o deve iniciar segunda etapa por e-mail');
expect(!str_contains($authJs, 'mfa.enroll'), 'Login nÃ£o deve cadastrar aplicativo autenticador');
expect(str_contains($authJs, 'window.nexlar'), 'Login deve usar a API global publicada pelo cliente');
expect(!str_contains($authJs, 'window.nexlarApi'), 'Login nÃ£o pode usar uma API global inexistente');

$authCss = file_get_contents($root . '/src/css/auth.css');
expect(!str_contains($authCss, '.email-step'), 'CSS nÃ£o deve manter a segunda etapa por e-mail');

$migration = file_get_contents($root . '/supabase/migrations/20261030213215_nexlar_backend.sql');
$api = file_get_contents($root . '/api/index.php');
expect(str_contains($migration, 'month date not null'), 'Meta mensal usa uma data de referÃªncia');
expect(!str_contains($api, 'monthly_goals?owner_id=eq.$userId&year='), 'API nÃ£o pode consultar colunas inexistentes de meta');
expect(!str_contains($api, "auth/email-step/start"), 'API nÃ£o deve exigir segunda etapa por e-mail');
expect(!str_contains($api, "auth/email-step/complete"), 'API nÃ£o deve concluir segunda etapa por e-mail');

$avatarMigration = file_get_contents($root . '/supabase/migrations/20261101120000_profile_avatar_storage.sql');
expect(str_contains($avatarMigration, 'file_size_limit'), 'Bucket de avatar deve impor limite de tamanho no Storage');
expect(str_contains($avatarMigration, 'allowed_mime_types'), 'Bucket de avatar deve impor os tipos permitidos no Storage');

$chatHtml = file_get_contents($root . '/src/pages/painelmensagens.html');
expect(!str_contains($chatHtml, '>Online<'), 'Chat nÃ£o pode simular presenÃ§a online');
expect(substr_count($chatHtml, '/src/js/api.js') === 1, 'Chat deve carregar o cliente de API uma Ãºnica vez');
expect(str_contains($chatHtml, 'id="connectionStatus"'), 'Chat deve comunicar o estado da conexÃ£o em tempo real');
$chatJs = file_get_contents($root . '/src/js/painelmensagens.js');
expect(!str_contains($chatJs, 'setInterval('), 'Fallback do chat nÃ£o pode sobrepor requisiÃ§Ãµes lentas');
expect(str_contains($chatJs, 'isCurrentOpen'), 'Troca rÃ¡pida de conversa deve invalidar carregamentos antigos');
expect(!str_contains($chatJs, "[data-page=\"financeiro\"]')?.remove()"), 'Mensagens nÃ£o deve remover o Financeiro da navegaÃ§Ã£o');

$responsiveCss = file_get_contents($root . '/src/css/responsive.css');
expect(str_contains($responsiveCss, 'env(safe-area-inset-bottom'), 'Layout mÃ³vel deve respeitar a safe area inferior');
expect(str_contains($responsiveCss, 'env(safe-area-inset-top'), 'Chat mÃ³vel deve respeitar a safe area superior');
expect(str_contains($responsiveCss, 'min-height: 44px'), 'Controles mÃ³veis devem ter alvo de toque mÃ­nimo');

$financeCss = file_get_contents($root . '/src/css/Painelfinanceiro.css');
expect(str_contains($financeCss, '.goal-editor-controls'), 'Editor de meta precisa de layout responsivo prÃ³prio');

$profileHtml = file_get_contents($root . '/src/pages/Meuperfil.html');
foreach (['avatarUploadModal', 'avatarDropzone', 'avatarFileInput', 'avatarUploadMessage', 'cancelAvatarUpload', 'saveAvatarUpload'] as $avatarControl) {
    expect(str_contains($profileHtml, 'id="' . $avatarControl . '"'), 'Modal de avatar deve possuir o controle ' . $avatarControl);
}
expect(str_contains($profileHtml, 'role="dialog"'), 'Modal de avatar deve expor semÃ¢ntica de diÃ¡logo');
expect(str_contains($profileHtml, 'aria-modal="true"'), 'Modal de avatar deve bloquear o contexto externo para leitores de tela');

foreach (['Meuperfil' => 'perfil', 'Painelfinanceiro' => 'financeiro', 'painelmensagens' => 'mensagens'] as $page => $active) {
    $html = file_get_contents($root . '/src/pages/' . $page . '.html');
    expect(substr_count($html, '<nexlar-panel-nav ') === 1, $page . ' deve usar }µã‹h‘éì¶»§q«^uË˜™K˜]›[ÜÝ
Œ
NÂˆ^XÝ
ÙXÛÛ™›Y
KË˜™K˜]›X\Ý
š\œÝœšYÚ
NÂˆ^XÝ
ÙXÛÛ™Ü
KË™\]X[
š\œÝÜ
NÂˆJNÂˆÞK˜ÛÛZ[œÊ	ÈØØ\™È˜Ø\™	Ë	ÓX\šXHÛÜÝIÊKœÚÝ[
	Ø™Kš\ÚX›IÊNÂˆJNÂ‚ˆ]
	Ý\ØHÜÈY\Û[ÜÈš[›ÜÈ˜HÛY\YÙH0î˜›XØIË

HOˆÂˆÞKš\Ú]
	ËÉÊNÂˆÞK™Ù]
	ÈØØ\™È˜Ø\™	ÊKœÚÝ[
	Ú]™K›[™Ý	ËÊNÂˆÞK™Ù]
	ÈÜÙ[X˜Z\œ›ÉÊKœÙ[XÝ
	ÙÛX˜KXIÊNÂˆÞK™Ù]
	ÈØØ\™È˜Ø\™š\ÚX›IÊKœÚÝ[
	Ú]™K›[™Ý	ËJK˜[™
	ØÛÛZ[‰Ë	Ò›ðèÛÈÚ[˜IÊNÂˆJNÂŸJNÂ‚™\ØÜšX™J	ÐØY\Ý›ÈH™\ÝYÜ‰Ë

HOˆÂˆ]
	ÜÛÛXÚ]HÙ\špéÛÈH˜Z\œ›ÈØ[°íšXÛÜÈ›ÈØY\Ý›È]]0í›Û[ÈH[\™\Ø\šX[	Ë

HOˆÂˆÞKš[\˜Ù\
	ÑÑU	Ë	ËÜÜ˜ËÚœËØ\KšœÉËÈ›ÙNˆ	ÝÚ[™ÝË›™^\”™XYOT›ÛZ\ÙKœ™\ÛÛ™JÜÝ\X˜\ÙNžØ]]žÜÚYÛ•\˜\Þ[˜Ê
OOŠÙ\œ›ÜŽ›[JKÚYÛ“Ý]˜\Þ[˜Ê
OOŠÙ\œ›ÜŽ›[J___JIÈJNÂˆ›Üˆ
ÛÛœÝ]ÙˆÉØØY\Ý›Ø]]Û›Û[Ëš[	Ë	ØØY\Ý›Ù[\™\ØKš[	×JHÂˆÞKš\Ú]
ÜÜ˜ËÜYÙ\ËÉÜ]XÈÛ™Y›Ü™SØY
Ú[ŠHÈÚ[‹—×Û™^\\HHÈÝ\X˜\ÙNˆÈ]]ˆÈÚYÛ•\ˆ\Þ[˜È

HOˆ
È\œ›ÜŽˆ[JKÚYÛ“Ý]ˆ\Þ[˜È

HOˆ
È\œ›ÜŽˆ[JHHHNÈHJNÂˆÞK™Ù]
	ÈÜÙ\šXÙPØ]YÛÜžIÊKœÚÝ[
	Ú]™K˜]‰Ë	Ü™\]Z\™Y	ÊNÂˆÞK™Ù]
	ÈÜÙ\šXÙPØ]YÛÜžHÜ[Û‰ÊKœÚÝ[
	ØÛÛZ[‰Ë	Ñ[0ê]šXØIÊNÂˆÞK™Ù]
	ÈÜ›ÝšY\“™ZYÚ›ÜšÛÙ	ÊKœÚÝ[
	Ú]™K˜]‰Ë	Ü™\]Z\™Y	ÊNÂˆÞK™Ù]
	ÈÜ›ÝšY\“™ZYÚ›ÜšÛÙÜ[Û‰ÊKœÚÝ[
	ØÛÛZ[‰Ë	ÑÛX˜HIÊNÂˆBˆJNÂ‚ˆ]
	Ù[šXHÙ\špéÛÈH˜Z\œ›È›ÜÈY]YYÜÈH]]0í›Û[ÜÈH[\™\Ø\ÉË

HOˆÂˆÞKš[\˜Ù\
	ÑÑU	Ë	ËÜÜ˜ËÚœËØ\KšœÉËÈ›ÙNˆ	ÝÚ[™ÝË›™^\”™XYOT›ÛZ\ÙKœ™\ÛÛ™JÚ[™ÝË—×Û™^\\JIÈJNÂˆ›Üˆ
ÛÛœÝXØÛÝ[ÙˆÂˆÈ]ˆ	ØØY\Ý›Ø]]Û›Û[Ëš[	ËØÝ[Y[Yˆ	ØÜ‰ËØÝ[Y[˜[YNˆ	ÍLŽNNŒÌIÈKˆÈ]ˆ	ØØY\Ý›Ù[\™\ØKš[	ËØÝ[Y[Yˆ	ØÛœ‰ËØÝ[Y[˜[YNˆ	ÌLŒÍMÎNL	ÈKˆJHÂˆÞKš\Ú]
ÜÜ˜ËÜYÙ\ËÉØXØÛÝ[œ]XÈÛ™Y›Ü™SØY
Ú[ŠHÂˆÚ[‹—×Û™^\\HHÈÝ\X˜\ÙNˆÈ]]ˆÂˆÚYÛ•\ˆ\Þ[˜ÈÜ[ÛœÈOˆÈÚ[‹—×ÜÚYÛ\Ü[ÛœÈHÜ[ÛœÎÈ™]\›ˆÈ\œ›ÜŽˆ[NÈKˆÚYÛ“Ý]ˆ\Þ[˜È

HOˆ
È\œ›ÜŽˆ[JKˆHHNÂˆHJNÂˆÞK™Ù]
	ÈÛ›ÛYIÊK\J	Ô™\ÝYÜˆ\ÝIÊNÂˆÞK™Ù]
	ÈÛ˜\ØÚ[Y[ÉÊK\J	ÌLLNNL	ÊNÂˆÞK™Ù]
ÉØXØÛÝ[™ØÝ[Y[YX
K\JXØÛÝ[™ØÝ[Y[˜[YJNÂˆÞK™Ù]
	ÈØÛÛ]ÉÊK\J	ÍÌNNNNNNNNNIÊNÂˆÞK™Ù]
	ÈÙ[XZ[	ÊK\J\ÝIØXØÛÝ[œ]P^[\K˜ÛÛX
NÂˆÞK™Ù]
	ÈÜÙ[šIÊK\J	ÔÙ[šLLŒÈIÊNÂˆÞK™Ù]
	ÈØÛÛ™š\›X\”Ù[šIÊK\J	ÔÙ[šLLŒÈIÊNÂˆÞK™Ù]
	ÈÜÙ\šXÙPØ]YÛÜžIÊKœÙ[XÝ
	Ñ[0ê]šXØIÊNÂˆÞK™Ù]
	ÈÜ›ÝšY\“™ZYÚ›ÜšÛÙ	ÊKœÙ[XÝ
	ÑÛX˜HIÊNÂˆÞK™Ù]
	ÈÝ\›[ÜÉÊK˜ÚXÚÊ
NÂˆÞK™Ù]
	ÈØÛÛ[X\‰ÊK˜ÛXÚÊ
NÂˆÞKÚ[™ÝÊ
Kš]Ê	××ÜÚYÛ\Ü[ÛœË›Ü[ÛœË™]IÊKœÚÝ[
	Ú[˜ÛYIËÂˆ›ÛNˆXØÛÝ[œ]OOH	ØØY\Ý›Ù[\™\ØKš[	ÈÈ	Ù[\™\ØIÈˆ	Ø]]Û›Û[ÉËˆÙ\šXÙWØØ]YÛÜžNˆ	Ñ[0ê]šXØIË™ZYÚ›ÜšÛÙˆ	ÑÛX˜HIËˆJNÂˆBˆJNÂŸJNÂ‚™\ØÜšX™J	ÑYpéðèÛÈÈ\™š[›Ùš\ÜÚ[Û˜[	Ë

HOˆÂˆ™Y›Ü™QXXÚ


HOˆÂˆÞKš[\˜Ù\
	ÑÑU	Ë	ËÜÜ˜ËÚœËØ\KšœÉËÈ›ÙNˆ	ÝÚ[™ÝË›™^\”™XYOT›ÛZ\ÙKœ™\ÛÛ™JÚ[™ÝË—×Û™^\\JIÈJNÂˆJNÂ‚ˆ]
	Ü\›Z]H[\˜\ˆÙ\špéÛÈH˜Z\œ›ÈH[šXHÜÈ›ÛY\Èš\ðë]™Z\ÉË

HOˆÂˆÞKš\Ú]
	ËÜÜ˜ËÜYÙ\ËÓY]\\™š[š[	ËÈÛ™Y›Ü™SØY
Ú[ŠHÂˆÛÛœÝÙ\ÜÚ[ÛˆHÈ\Ù\ŽˆÈYˆ	Ü›ÝšY\‹LIË[XZ[ˆ	Ø[˜P^[\K˜ÛÛIÈKXØÙ\Ü×ÝÚÙ[Žˆ	Ý\Ý]ÚÙ[‰ÈNÂˆÚ[‹—×Û™^\\HHÂˆÝ\X˜\ÙNˆÈ]]ˆÈÚYÛ“Ý]ˆ\Þ[˜È

HOˆ
È\œ›ÜŽˆ[JHHKˆ™\]Z\™TÙ\ÜÚ[ÛŽˆ\Þ[˜È

HOˆÙ\ÜÚ[Û‹ˆ™\]Y\Ýˆ\Þ[˜È
›Ý]KÜ[ÛœÊHOˆÂˆYˆ
›Ý]HOOH	ÛYIÈ	‰ˆ[Ü[ÛœÊH™]\›ˆÈYˆ	Ü›ÝšY\‹LIË›ÛNˆ	Ø]]Û›Û[ÉË[Û˜[YNˆ	Ð[˜H™\ÝYÜ˜IËÛ™Nˆ	ÉË™ZYÚ›ÜšÛÙˆ	ÑÛX˜HIËÙ\šXÙWØØ]YÛÜžNˆ	Ñ[0ê]šXØIËš[Îˆ	ÉË]˜]\—Ý\›ˆ[NÂˆYˆ
›Ý]HOOH	ÜÜ›Û[ÉÊH™]\›ˆ×NÂˆYˆ
›Ý]HOOH	ÛYIÈ	‰ˆÜ[ÛœÊHÈÚ[‹—×ÜØ]™Y›Ùš[HH”ÓÓ‹œ\œÙJÜ[ÛœË˜›ÙJNÈ™]\›ˆÈÚÎˆYHNÈBˆ›ÝÈ™]È\œ›ÜŠ[™^XÝY›Ý]H	Ü›Ý]_X
NÂˆKˆNÂˆHJNÂˆÞK™Ù]
	ÈÜ›Ùš[TÙ\šXÙIÊKœÚÝ[
	Ú]™K˜[YIË	Ñ[0ê]šXØIÊKœÙ[XÝ
	Ô[\˜IÊNÂˆÞK™Ù]
	ÈÜ›Ùš[S™ZYÚ›ÜšÛÙ	ÊKœÙ[XÝ
	ÑÛX˜H‰ÊNÂˆÞK™Ù]
	Ëœ›Ùš[KY›Ü›IÊKœÝX›Z]

NÂˆÞKÚ[™ÝÊ
Kš]Ê	××ÜØ]™Y›Ùš[IÊKœÚÝ[
	Ú[˜ÛYIËÈÙ\šXÙWØØ]YÛÜžNˆ	Ô[\˜IË™ZYÚ›ÜšÛÙˆ	ÑÛX˜H‰ÈJNÂˆJNÂ‚ˆ]
	ÛØÝ[HH^ÛZHØ[\ÜÈH™\ÝYÜˆ[ÈY]\ˆ[H\™š[ÛY[IË

HOˆÂˆÞKš\Ú]
	ËÜÜ˜ËÜYÙ\ËÓY]\\™š[š[	ËÈÛ™Y›Ü™SØY
Ú[ŠHÂˆÛÛœÝÙ\ÜÚ[ÛˆHÈ\Ù\ŽˆÈYˆ	ØÛY[LIË[XZ[ˆ	ØÛY[P^[\K˜ÛÛIÈKXØÙ\Ü×ÝÚÙ[Žˆ	Ý\Ý]ÚÙ[‰ÈNÂˆÚ[‹—×Û™^\\HHÂˆÝ\X˜\ÙNˆÈ]]ˆÈÚYÛ“Ý]ˆ\Þ[˜È

HOˆ
È\œ›ÜŽˆ[JHHKˆ™\]Z\™TÙ\ÜÚ[ÛŽˆ\Þ[˜È

HOˆÙ\ÜÚ[Û‹ˆ™\]Y\Ýˆ\Þ[˜È
›Ý]KÜ[ÛœÊHOˆÂˆYˆ
›Ý]HOOH	ÛYIÈ	‰ˆ[Ü[ÛœÊH™]\›ˆÈYˆ	ØÛY[LIË›ÛNˆ	ØÛY[IË[Û˜[YNˆ	ÐÛY[IËÛ™Nˆ	ÉËš[Îˆ	ÉË]˜]\—Ý\›ˆ[NÂˆYˆ
›Ý]HOOH	ÛYIÈ	‰ˆÜ[ÛœÊHÈÚ[‹—×ÜØ]™Y›Ùš[HH”ÓÓ‹œ\œÙJÜ[ÛœË˜›ÙJNÈ™]\›ˆÈÚÎˆYHNÈBˆ›ÝÈ™]È\œ›ÜŠ[™^XÝY›Ý]H	Ü›Ý]_X
NÂˆKˆNÂˆHJNÂˆÞK™Ù]
	ÈÜ›Ùš[S™ZYÚ›ÜšÛÙ	ÊKœÚÝ[
	Ø™K™\ØX›Y	ÊK˜ÛÜÙ\Ý
	Ë™›Ü›KYÜ›Ý\	ÊKœÚÝ[
	Û›Ý˜™Kš\ÚX›IÊNÂˆÞK™Ù]
	ÈÜ›Ùš[TÙ\šXÙIÊKœÚÝ[
	Ø™K™\ØX›Y	ÊK˜ÛÜÙ\Ý
	Ë™›Ü›KYÜ›Ý\	ÊKœÚÝ[
	Û›Ý˜™Kš\ÚX›IÊNÂˆÞK™Ù]
	ÈÜ›Ùš[S˜[YIÊKœÚÝ[
	Ú]™K˜[YIË	ÐÛY[IÊNÂˆÞK™Ù]
	Ë˜‹\Ø]™IÊK˜ÛXÚÊ
NÂˆÞKÚ[™ÝÊ
KœÚÝ[
Ú[ˆOˆÂˆ^XÝ
Ú[‹—×ÜØ]™Y›Ùš[JK››ÝËš]™Kœ›Ü\J	Û™ZYÚ›ÜšÛÙ	ÊNÂˆ^XÝ
Ú[‹—×ÜØ]™Y›Ùš[JK››ÝËš]™Kœ›Ü\J	ÜÙ\šXÙWØØ]YÛÜžIÊNÂˆJNÂˆJNÂŸJNÂ‚™\ØÜšX™J	Ð]˜]\™\È›ÈÚ]	Ë

HOˆÂˆ]
	Û[ÜÝ˜HH›ÝÈ›ÈÛÛ]ÈH›ÈØX™péØ[ÈÙ[HÛØœ™\Üˆ\È[šXÚXZ\ÉË

HOˆÂˆÞKš[\˜Ù\
	ÑÑU	Ë	ËÜÜ˜ËÚœËØ\KšœÉËÈ›ÙNˆ	ÝÚ[™ÝË›™^\”™XYOT›ÛZ\ÙKœ™\ÛÛ™JÚ[™ÝË—×Û™^\\JIÈJNÂˆÞKš[\˜Ù\
	ÑÑU	Ë	ËØ]˜]\‹XÚ]œÝ™ÉËÂˆÝ]\ÐÛÙNˆŒXY\œÎˆÈ	ØÛÛ[]\IÎˆ	Ú[XYÙKÜÝ™ÊÞ[	ÈKˆ›ÙNˆ	ÏÝ™È[œÏHš‹ËÝÝÝËÌË›Ü™ËÌŒÜÝ™ÈˆÚYHˆZYÚHÚ\˜ÛHÞHŒŒˆÞOHŒŒˆHŒŒˆš[H™Ü™Y[ˆ‹ÏÜÝ™Ï‰ËˆJNÂˆÞKš\Ú]
	ËÜÜ˜ËÜYÙ\ËÜZ[™[Y[œØYÙ[œËš[	ËÈÛ™Y›Ü™SØY
Ú[ŠHÂˆÛÛœÝÙ\ÜÚ[ÛˆHÈ\Ù\ŽˆÈYˆ	ØÛY[LIË[XZ[ˆ	ØÛY[^[\K˜ÛÛIÈKXØÙ\Ü×ÝÚÙ[Žˆ	Ý\Ý]ÚÙ[‰ÈNÂˆÛÛœÝ›ÝšY\ˆHÈYˆ	Ü›ÝšY\‹LIË[Û˜[YNˆ	Ñ]šH[\ÉË]˜]\—Ý\›ˆ	ËØ]˜]\‹XÚ]œÝ™ÉÈNÂˆÛÛœÝÛÛ™\œØ][ÛˆHÈYˆ	ØÛÛ™\œØ][Û‹LIËÛY[ÚYˆ	ØÛY[LIË›ÝšY\—ÚYˆ	Ü›ÝšY\‹LIËÛY[ˆÈYˆ	ØÛY[LIË[Û˜[YNˆ	ÐÛY[IÈK›ÝšY\‹\]YØ]ˆ	ÌŒ‹LLKL•LŽŒŒ‰ÈNÂˆÛÛœÝÚ[›™[HÈÛŠ
HÈ™]\›ˆ\ÎÈKÝXœØÜšX™JØ[˜XÚÊHÈØ[˜XÚÊ	ÔÕP”ÐÔ’P‘Q	ÊNÈ™]\›ˆ\ÎÈHNÂˆÚ[‹—×Û™^\\HHÂˆÝ\X˜\ÙNˆÈ]]ˆÈÚYÛ“Ý]ˆ\Þ[˜È

HOˆ
È\œ›ÜŽˆ[JHKÚ[›™[ˆ

HOˆÚ[›™[™[[Ý™PÚ[›™[ˆ\Þ[˜È

HOˆßHKˆ™\]Z\™TÙ\ÜÚ[ÛŽˆ\Þ[˜È

HOˆÙ\ÜÚ[Û‹ˆ™\]Y\Ýˆ\Þ[˜È›Ý]HOˆÂˆYˆ
›Ý]HOOH	ÛYIÊH™]\›ˆÈYˆ	ØÛY[LIË›ÛNˆ	ØÛY[IË[Û˜[YNˆ	ÐÛY[IÈNÂˆYˆ
›Ý]HOOH	ØÛÛ™\œØ][ÛœÉÊH™]\›ˆØÛÛ™\œØ][Û—NÂˆYˆ
›Ý]KœÝ\ÕÚ]
	ÛY\ÜØYÙ\É‰ÊH›Ý]KœÝ\ÕÚ]
	ØÛÛ˜XÝÉ‰ÊJH™]\›ˆ×NÂˆ›ÝÈ™]È\œ›ÜŠ[™^XÝY›Ý]H	Ü›Ý]_X
NÂˆKˆNÂˆHJNÂˆÞK™Ù]
	Ë˜ÛÛ™\œØ][Û‹Z][H˜]˜]\‰ÊKœÚÝ[
	Ú]™K˜Û\ÜÉË	Ú\Ë\ÝÉÊBˆ™š[™
	Ë˜]˜]\‹Y˜[˜XÚÉÊKœÚÝ[
	Ú]™K˜ÜÜÉË	Ýš\ÚXš[]IË	ÚY[‰ÊNÂˆÞK™Ù]
	Ë˜ÛÛ™\œØ][Û‹Z][IÊK˜ÛXÚÊ
NÂˆÞK™Ù]
	ÈØÚ]XY\]˜]\‰ÊKœÚÝ[
	Ú]™K˜Û\ÜÉË	Ú\Ë\ÝÉÊBˆ™š[™
	Ë˜]˜]\‹Y˜[˜XÚÉÊKœÚÝ[
	Ú]™K˜ÜÜÉË	Ýš\ÚXš[]IË	ÚY[‰ÊNÂˆJNÂŸJNÂ