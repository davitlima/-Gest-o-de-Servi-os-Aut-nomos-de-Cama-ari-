
<?php
$saldoTotal = (float) ($resumo['saldo_total'] ?? 0);
$ganhosMes = (float) ($resumo['receitas_mes'] ?? 0);
$despesasMes = (float) ($resumo['despesas_mes'] ?? 0);
$metaMensal = 5000.00;

$percentualMeta = $metaMensal > 0
    ? min(100, ($ganhosMes / $metaMensal) * 100)
    : 0;

$mediaMensal = $resumo['media_mensal'] ?? 0;
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel Financeiro | Nexlar</title>

    <link rel="stylesheet" href="/src/css/global.css">
    <link rel="stylesheet" href="/src/css/Painelfinanceiro.css">

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>

<body>

<aside class="sidebar">
    <div class="logo">
        <img
            src="/src/images/Logo.png"
            alt="Nexlar"
            class="logo-image-main"
        >
    </div>

    <nav>
        <a href="/index.php?page=inicio" class="nav-link">
            <span>⌂</span> Início
        </a>

        <a href="/index.php?page=perfil" class="nav-link">
            <span>♙</span> Meu Perfil
        </a>

        <a href="/index.php?page=financeiro"
           class="nav-link active">
            <span>$</span> Financeiro
        </a>

        <a href="/index.php?page=mensagens" class="nav-link">
            <span>▢</span> Mensagem
        </a>
    </nav>
</aside>

<main class="main">

    <header class="top-bar">
        <h1>Painel do Autônomo</h1>

        <button
            type="button"
            class="btn-primary"
            onclick="abrirModal()"
        >
            + Adicionar Registro
        </button>
    </header>

    <section class="kpi-row">

        <article class="card kpi-card">
            <div class="card-header">
                <span class="icon-wrap icon-blue">▤</span>
            </div>

            <p class="kpi-label">Ganho do Mês</p>

            <p class="kpi-value">
                R$ <?= number_format($ganhosMes, 2, ',', '.') ?>
            </p>
        </article>

        <article class="card kpi-card">
            <div class="card-header">
                <span class="icon-wrap icon-green">↗</span>
            </div>

            <p class="kpi-label">Média mensal</p>

            <p class="kpi-value">
                R$ <?= number_format((float) $mediaMensal, 2, ',', '.') ?>
            </p>
        </article>

        <article class="card kpi-card">
            <div class="card-header">
                <span class="icon-wrap icon-purple">$</span>
            </div>

            <p class="kpi-label">Meta mensal</p>

            <p class="kpi-value">
                R$ <?= number_format($metaMensal, 2, ',', '.') ?>
            </p>

            <div class="progress-track">
                <div
                    class="progress-fill"
                    style="width: <?= $percentualMeta ?>%"
                ></div>
            </div>

            <div class="progress-info">
                <span>
                    R$ <?= number_format($ganhosMes, 2, ',', '.') ?>
                    / R$ <?= number_format($metaMensal, 2, ',', '.') ?>
                </span>

                <span><?= number_format($percentualMeta, 0) ?>%</span>
            </div>
        </article>

    </section>

    <section class="chart-row">

        <article class="card chart-card">
            <h3>Ganhos</h3>
            <canvas id="graficoGanhos"></canvas>
        </article>

        <article class="card chart-card">
            <h3>Vendas</h3>
            <canvas id="graficoVendas"></canvas>
        </article>

    </section>

    <section class="history-section">
        <h3>Histórico de Serviços</h3>

        <?php if (!empty($transacoes)): ?>

            <?php foreach ($transacoes as $t): ?>
                <article class="service-item">
                    <div>
                        <span>
                            <?= htmlspecialchars(
                                $t['descricao'] ?? '',
                                ENT_QUOTES,
                                'UTF-8'
                            ) ?>
                        </span>

                        <span class="service-hint">
                            <?= htmlspecialchars(
                                ucfirst($t['tipo'] ?? ''),
                                ENT_QUOTES,
                                'UTF-8'
                            ) ?>
                            ·
                            <?php
                            $data = $t['data_transacao'] ?? null;
                            echo $data
                                ? date('d/m/Y', strtotime($data))
                                : 'Sem data';
                            ?>
                        </span>
                    </div>

                    <span class="service-val">
                        R$ <?= number_format(
                            (float) ($t['valor'] ?? 0),
                            2,
                            ',',
                            '.'
                        ) ?>
                    </span>
                </article>
            <?php endforeach; ?>

        <?php else: ?>

            <p class="empty-state">
                Nenhum registro encontrado. Clique em
                "Adicionar Registro" para começar.
            </p>

        <?php endif; ?>
    </section>

</main>

<div class="modal-overlay" id="modalRegistro">
    <section class="modal">

        <header class="modal-header">
            <h2>Adicionar Registro</h2>

            <button
                type="button"
                class="modal-close"
                onclick="fecharModal()"
                aria-label="Fechar"
            >&times;</button>
        </header>

        <form method="POST" action="/index.php?page=financeiro&acao=criar">

            <div class="modal-body">

                <div class="form-group">
                    <label for="descricao">Descrição</label>
                    <input
                        id="descricao"
                        name="descricao"
                        type="text"
                        maxlength="255"
                        required
                    >
                </div>

                <div class="form-row">

                    <div class="form-group">
                        <label for="tipo">Tipo</label>

                        <select id="tipo" name="tipo" required>
                            <option value="receita">Receita</option>
                            <option value="despesa">Despesa</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="valor">Valor (R$)</label>

                        <input
                            id="valor"
                            name="valor"
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                        >
                    </div>

                </div>

                <div class="form-group">
                    <label for="data_transacao">Data</label>

                    <input
                        id="data_transacao"
                        name="data_transacao"
                        type="date"
                        required
                    >
                </div>

            </div>

            <footer class="modal-footer">
                <button
                    type="button"
                    class="btn-secondary"
                    onclick="fecharModal()"
                >
                    Cancelar
                </button>

                <button type="submit" class="btn-primary">
                    Salvar registro
                </button>
            </footer>

        </form>

    </section>
</div>

<script>
function abrirModal() {
    document.getElementById('modalRegistro').classList.add('open');
}

function fecharModal() {
    document.getElementById('modalRegistro').classList.remove('open');
}

const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const valoresGanhos = <?= json_encode(
    $ganhosPorMes ?? array_fill(0, 12, 0)
) ?>;

const valoresVendas = <?= json_encode(
    $vendasPorMes ?? array_fill(0, 12, 0)
) ?>;

function criarGrafico(id, valores) {
    new Chart(document.getElementById(id), {
        type: 'line',

        data: {
            labels: meses,

            datasets: [{
                data: valores,
                borderColor: '#6558e8',
                backgroundColor: 'rgba(101, 88, 232, 0.10)',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.3,
                fill: true
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: { display: false }
            },

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

criarGrafico('graficoGanhos', valoresGanhos);
criarGrafico('graficoVendas', valoresVendas);
</script>

</body>
</html>
