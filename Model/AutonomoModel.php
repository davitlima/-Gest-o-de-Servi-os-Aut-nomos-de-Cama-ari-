<?php

namespace Model;

use Config\Connection;
use PDO;

class AutonomoModel {

    private $conn;

    public function __construct() {
    
        $this->conn = Connection::getConnection();
    }

    public function buscarPorId($id) {
    
        $stmt = $this->conn->prepare("SELECT * FROM autonomos WHERE id = :id");
        $stmt->bindValue(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getServicosPrestados($autonomoId) {
    
        $stmt = $this->conn->prepare("SELECT * FROM servicos WHERE autonomo_id = :id");
        $stmt->bindValue(':id', $autonomoId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}