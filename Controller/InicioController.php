<?php
namespace Controller;

use Model\ServicoModel;

class InicioController
{
    public function index(): void
    {
        $servicoModel = new ServicoModel();
        $servicos = $servicoModel->listarDestaques();

        require __DIR__ . '/../src/pages/inicio.html';
    }
}
