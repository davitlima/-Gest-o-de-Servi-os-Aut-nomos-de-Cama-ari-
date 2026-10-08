<?php

namespace Model;

use Config\Connection;
use PDO;

class ServicoModel {

    private $conn;

    public function __construct() {
    
        $this->conn = Connection::getConnection();
    }

    public function listarDestaques() {
    
        $stmt = $this->conn->prepare("SELECT s.id, s.titulo, s.categoria, s.descricao, a.nome AS autonomo_nome, a.foto FROM servicos s JOIN autonomos a ON s.autonomo_id = a.id LIMIT 6");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}