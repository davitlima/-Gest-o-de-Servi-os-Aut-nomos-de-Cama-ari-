<?php

namespace Config;

use PDO;
use PDOException;

class Connection {

    private static $instance = null;

    public static function getConnection() {
    
        if (self::$instance === null) {
            try {
                $host = 'localhost';
                $db   = 'gestao_autonomos';
                $user = 'root';
                $pass = '';

                self::$instance = new PDO("mysql:host={$host};dbname={$db};charset=utf8", $user, $pass);
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            } catch (PDOException $e) {
                die("Erro na Conexão: " . $e->getMessage());
            }
        }
        return self::$instance;
    }
}