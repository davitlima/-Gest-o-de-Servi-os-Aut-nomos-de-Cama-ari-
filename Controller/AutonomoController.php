<?php

namespace Controller;

use Model\AutonomoModel;

class AutonomoController {

    public function index() {
    
        $id = $_GET['id'] ?? 1;

        $autonomoModel = new AutonomoModel();
        $perfil = $autonomoModel->buscarPorId($id);
        $servicos = $autonomoModel->getServicosPrestados($id);

        require_once __DIR__ . '/../View/perfilAutonomo.php';
    }
}