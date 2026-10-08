<?php

namespace Model;

use Config\Connection;
use PDO;

class FinanceiroModel {

    private $conn;

    public function __construct() {
    
        $this->conn = Connection::getConnection();
    }

    public function getResumo($autonomoId) {

        $stmt = $this->conn->prepare("SELECT saldo_total, receitas_mes, despesas_mes FROM financeiro_resumo WHERE autonomo_id = :id");
        $stmt->bindValue(':id', $autonomoId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getTransacoes($autonomoId) {
    
        $stmt = $this->conn->prepare("SELECT descricao, valor, tipo, data_transacao FROM transacoes WHERE autonomo_id = :id ORDER BY data_transacao DESC");
        $stmt->bindValue(':id', $autonomoId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}