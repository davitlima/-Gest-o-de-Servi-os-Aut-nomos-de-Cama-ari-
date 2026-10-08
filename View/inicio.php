<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Início - Autônomos Camaçari</title>
  
    <link rel="stylesheet" href="../src/css/global.css">
    <link rel="stylesheet" href="../src/css/inicio.css">
</head>
<body>
    <header>
        <h1>Gestão de Serviços Autônomos de Camaçari</h1>
    </header>

    <main class="container">
        <h2>Serviços Disponíveis</h2>

        <div class="servicos-grid">
            <?php if (!empty($servicos)): ?>
                <?php foreach ($servicos as $servico): ?>
                    <div class="card-servico">
                        <h3><?= htmlspecialchars($servico['titulo']) ?></h3>
                        <p><?= htmlspecialchars($servico['descricao']) ?></p>
                        <p><strong>Profissional:</strong> <?= htmlspecialchars($servico['autonomo_nome']) ?></p>
                        <a href="index.php?page=perfil&id=<?= $servico['id'] ?>">Ver perfil</a>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <p>Nenhum serviço cadastrado no momento.</p>
            <?php endif; ?>
        </div>
    </main>

    <script src="../src/js/inicio.js"></script>
</body>
</html>