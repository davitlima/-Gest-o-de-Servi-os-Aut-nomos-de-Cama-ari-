<?php

namespace Controller;

use Model\FinanceiroModel;

class FinanceiroController {

    public function index()
    {
        $autonomoId = $_SESSION['autonomo_id'] ?? 1; // ID do usuário logado
        
        $financeiroModel = new FinanceiroModel();
        $resumo = $financeiroModel->getResumo($autonomoId);
        $transacoes = $financeiroModel->getTransacoes($autonomoId);

        require_once __DIR__ . '/../View/Painelfinanceiro.php';
    }
}