# Estrutura MVC do Nexlar

O ponto de entrada PHP é `index.php`. Ele identifica a página solicitada e
encaminha a execução para `Controller/PageController.php`, que carrega a View
correspondente. O mapeamento das páginas fica em `Model/Page.php` e o carregamento
compartilhado em `Config/App.php`.

As rotas antigas (`/src/pages/*.html`) continuam aceitas por compatibilidade,
mas agora são reescritas para o front controller na Vercel. Os arquivos de
estilo, imagens e JavaScript permanecem em `src/` como recursos da interface;
JavaScript continua reservado para chat em tempo real, máscaras, gráficos e
interações que dependem do navegador.

Novas telas devem ser adicionadas ao mapa de `Model/Page.php` e expostas por
`PageController`, em vez de criar outro ponto de entrada PHP.

