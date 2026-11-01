# Navegação compartilhada do painel profissional

## Intenção

Eliminar as três implementações divergentes de navegação existentes em Meu Perfil, Financeiro e Mensagens. As três páginas devem usar a mesma estrutura, aparência e comportamento móvel do painel financeiro atual.

## Escopo

- Criar um componente compartilhado de navbar/sidebar com os links Início, Meu Perfil, Financeiro e Mensagens.
- Cada página informará apenas qual item está ativo.
- Compartilhar também o drawer móvel, overlay, controle de foco, tecla Escape, safe areas e estados acessíveis.
- Remover das três páginas o HTML, CSS e JavaScript duplicados da navegação.
- Manter `inicio.html` inalterado; ele será somente o destino do link Início.

## Abordagens consideradas

- **Componente JavaScript com CSS compartilhado — escolhida:** compatível com as páginas HTML estáticas atuais, centraliza marcação e comportamento e evita carregamento visual tardio de um fragmento remoto.
- **Fragmento HTML carregado por requisição:** reduziria a marcação, mas adicionaria uma requisição, risco de flash sem navegação e tratamento extra de falhas.

## Comportamento

- Desktop: sidebar fixa no mesmo padrão visual do painel financeiro.
- Celular: botão de menu abre um drawer lateral; overlay, botão fechar, link selecionado e tecla Escape fecham o drawer.
- A página ativa será anunciada com `aria-current="page"`.
- Alvos de toque terão pelo menos 44 px e o componente respeitará safe areas e preferência por movimento reduzido.

## Não objetivos

- Alterar o conteúdo ou layout principal das três páginas.
- Modificar a navegação de `inicio.html`.
- Mudar permissões do backend ou os papéis cliente, autônomo e empresa.

## Aceite

- As três páginas renderizam a mesma navbar por uma única fonte compartilhada.
- Todos os quatro links aparecem nas três páginas e o item ativo está correto.
- O drawer funciona em 320 px e 390 px; a sidebar permanece fixa no desktop.
- Não há HTML ou manipuladores de drawer duplicados nas páginas.
- Testes automatizados, inspeção visual e validação pública na Vercel passam.

