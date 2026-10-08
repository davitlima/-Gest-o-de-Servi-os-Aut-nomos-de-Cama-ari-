<?php
// Ativar exibição de erros para depuração
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

spl_autoload_register(function ($class) {
    // Transforma "Controller\InicioController" em "Controller/InicioController.php"
    $file = __DIR__ . '/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use Controller\InicioController;
use Controller\FinanceiroController;
use Controller\AutonomoController;

$page = $_GET['page'] ?? 'inicio';

switch ($page) {
    case 'inicio':
        (new InicioController())->index();
        break;

    case 'financeiro':
        (new FinanceiroController())->index();
        break;

    case 'perfil':
        (new AutonomoController())->index();
        break;

    default:
        (new InicioController())->index();
        break;
}