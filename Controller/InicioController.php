<?php

namespace Controller;

use Model\ServicoModel;

class InicioController {

    public function index() {
    
        $servicoModel = new ServicoModel();
        $servicos = $servicoModel->listarDestaques();

        require_once __DIR__ . '/../View/inicio.php';
    }
}