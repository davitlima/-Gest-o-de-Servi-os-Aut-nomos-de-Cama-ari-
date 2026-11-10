<?php

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/Config/App.php';
require __DIR__ . '/Model/Page.php';
require __DIR__ . '/Controller/PageController.php';

use Nexlar\Mvc\PageController;

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$page = trim((string) ($_GET['page'] ?? ''), '/');

if ($page === '') {
    $page = match ($requestPath) {
        '/', '/index.php' => 'inicio',
        '/login.html' => 'login',
        '/cadastro.html' => 'cadastro',
        '/cadastrocliente.html' => 'cadastrocliente',
        '/cadastroautonomo.html' => 'cadastroautonomo',
        '/cadastroempresa.html' => 'cadastroempresa',
        '/perfilAutonomo.html' => 'perfilAutonomo',
        '/Meuperfil.html' => 'Meuperfil',
        '/Painelfinanceiro.html' => 'Painelfinanceiro',
        '/painelmensagens.html' => 'painelmensagens',
        '/lgpd.html' => 'lgpd',
        default => '',
    };
}

(new PageController())->show($page);

