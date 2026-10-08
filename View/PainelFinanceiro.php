<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel Financeiro</title>
    <link rel="stylesheet" href="../src/css/global.css">
    <link rel="stylesheet" href="../src/css/Painelfinanceiro.css">
</head>
<body>
    <main class="container">
        <h2>Painel Financeiro</h2>

        <div class="cards-resumo">
            <div class="card">
                <h3>Saldo Total</h3>
                <p>R$ <?= number_format($resumo['saldo_total'] ?? 0, 2, ',', '.') ?></p>
            </div>
            <div class="card">
                <h3>Receitas do Mês</h3>
                <p>R$ <?= number_format($resumo['receitas_mes'] ?? 0, 2, ',', '.') ?></p>
            </div>
            <div class="card">
                <h3>Despesas do Mês</h3>
                <p>R$ <?= number_format($resumo['despesas_mes'] ?? 0, 2, ',', '.') ?></p>
            </div>
        </div>

        <h3>Histórico de Lançamentos</h3>
        <table class="tabela-financeira">
            <thead>
                <tr>
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Data</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($transacoes)): ?>
                    <?php foreach ($transacoes as $t): ?>
                        <tr>
                            <td><?= htmlspecialchars($t['descricao']) ?></td>
                            <td><?= ucfirst($t['tipo']) ?></td>
                            <td>R$ <?= number_format($t['valor'], 2, ',', '.') ?></td>
                            <td><?= date('d/m/Y', strtotime($t['data_transacao'])) ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="4">Nenhuma transação encontrada.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </main>

    <script src="../src/js/Painelfinanceiro.js"></script>
</body>
</html>