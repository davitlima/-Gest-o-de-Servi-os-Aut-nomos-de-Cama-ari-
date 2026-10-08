<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perfil do Autônomo</title>
    <link rel="stylesheet" href="../src/css/global.css">
    <link rel="stylesheet" href="../src/css/perfilAutonomo.css">
</head>
<body>
    <main class="container">
        <?php if ($perfil): ?>
            <div class="perfil-info">
                <h2><?= htmlspecialchars($perfil['nome']) ?></h2>
                <p><strong>Profissão:</strong> <?= htmlspecialchars($perfil['profissao']) ?></p>
                <p><strong>Contato:</strong> <?= htmlspecialchars($perfil['telefone']) ?></p>
                <p><strong>Bio:</strong> <?= htmlspecialchars($perfil['biografia']) ?></p>
            </div>

            <h3>Serviços Realizados</h3>
            <div class="lista-servicos">
                <?php foreach ($servicos as $s): ?>
                    <div class="item-servico">
                        <h4><?= htmlspecialchars($s['titulo']) ?></h4>
                        <p><?= htmlspecialchars($s['descricao']) ?></p>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <p>Profissional não encontrado.</p>
        <?php endif; ?>
    </main>

    <script src="../src/js/perfilAutonomo.js"></script>
</body>
</html>