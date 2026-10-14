<?php

namespace Config;

use PDO;
use PDOException;

class Connection {

    private static $instance = null;

    public static function getInstance() {
    
        if (self::$instance === null) {
      
            $host = 'aws-1-ca-central-1.pooler.supabase.com';
            $port = '5432';
            $db   = 'postgres';
            $user = 'postgres.tvmeyljjmfmaaookwhyk';
            $pass = 'Linda@101108202'; 

            $dsn = "pgsql:host=$host;port=$port;dbname=$db;options='--search_path=public'";

            try {
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_TIMEOUT => 10
                ]);
            } catch (PDOException $e) {
                die("Erro na Conexão com Supabase: " . $e->getMessage());
            }
        }
        return self::$instance;
    }

    public static function getConnection()
    {
        return self::getInstance();
    }
}