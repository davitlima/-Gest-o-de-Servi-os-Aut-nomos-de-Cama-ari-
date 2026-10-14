<?php

namespace Model;

use Config\Connection;
use PDO;

class FinanceiroModel
{
    private PDO $conn;

    public function __construct()
    {
        $this->conn = Connection::getConnection();
    }

    public function getResumo(int $autonomoId): array
    {
        $sql = "
            SELECT
                COALESCE(SUM(
                    CASE
                        WHEN tipo = 'receita' THEN valor
                        WHEN tipo = 'despesa' THEN -valor
                        ELSE 0
                    END
                ), 0) AS saldo_total,

                COALESCE(SUM(
                    CASE
                        WHEN tipo = 'receita'
                        AND data_transacao >= DATE_TRUNC('month', CURRENT_DATE)
                        AND data_transacao < DATE_TRUNC('month', CURRENT_DATE)
                            + INTERVAL '1 month'
                        THEN valor ELSE 0
                    END
                ), 0) AS receitas_mes,

                COALESCE(SUM(
                    CASE
                        WHEN tipo = 'despesa'
                        AND data_transacao >= DATE_TRUNC('month', CURRENT_DATE)
                        AND data_transacao < DATE_TRUNC('month', CURRENT_DATE)
                            + INTERVAL '1 month'
                        THEN valor ELSE 0
                    END
                ), 0) AS despesas_mes

            FROM public.financeiro
            WHERE autonomo_id = :id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['id' => $autonomoId]);

        return $stmt->fetch() ?: [
            'saldo_total' => 0,
            'receitas_mes' => 0,
            'despesas_mes' => 0
        ];
    }

    public function getTransacoes(int $autonomoId): array
    {
        $sql = "
            SELECT
                id,
                descricao,
                tipo,
                valor,
                data_transacao
            FROM public.financeiro
            WHERE autonomo_id = :id
            ORDER BY data_transacao DESC, id DESC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['id' => $autonomoId]);

        return $stmt->fetchAll();
    }
}
