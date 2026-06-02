Funcionalidade: Testes de Fluxo de Navegação Completa - Nexlar

  Cenário: Deve navegar com sucesso por todas as páginas do sistema
    Dado que eu estou na página inicial do Nexlar
    Quando eu clico no botão "Painel" na barra de ações superior
    Então eu devo ser redirecionado para a página do "PainelFinanceiro.html"

    Dado que eu volto para a página inicial do Nexlar
    Quando eu clico no botão "Meu Perfil" na barra de ações superior
    Então eu devo ser redirecionado para a página do "Meuperfil.html"

    Quando eu clico no link "Financeiro" da barra lateral
    Então eu devo ser redirecionado para a página do "PainelFinanceiro.html"

    Quando eu clico no link "Mensagem" da barra lateral
    Então eu devo ser redirecionado para a página do "painelmensagens.html"

    Quando eu clico no link "Início" da barra lateral
    Então eu devo ser redirecionado para a página do "inicio.html"

    Quando eu clico no primeiro card de profissional autônomo disponível
    Então eu devo ser redirecionado para a página do "perfilAutonomo.html"

----------------------------------------------------------------------------------------
Funcionalidade: Painel Financeiro - Nexlar

  Contexto:
    Dado que eu acesso a página do Painel Financeiro

  Cenário: Validar o estado inicial da tela antes de ter registros
    Então o card de ganho do mês deve exibir "R$ 0,00"
    E o card de média mensal deve exibir "R$ 0,00"
    E a barra de progresso da meta deve exibir "0%"
    E o histórico deve exibir a mensagem "Nenhum registro ainda. Clique em \"Adicionar Registro\"."

  Cenário: Abrir o modal, preencher os dados e salvar um novo serviço com sucesso
    Quando eu clico no botão "+ Adicionar Registro"
    E preencho o formulário de registro com os dados do serviço "Instalação Elétrica - Camaçari" com valor "1500.00"
    E clico em "Salvar Registro"
    Então o modal de registro deve ser fechado
    E o histórico deve conter o serviço "Instalação Elétrica - Camaçari" com o valor de "R$ 1.500,00"
    E o card de ganho do mês não deve mais exibir "R$ 0,00"

  Cenário: Fechar o modal usando as opções de cancelamento
    Quando eu clico no botão "+ Adicionar Registro"
    E clico no botão de fechar do topo do modal
    Então o modal de registro deve ser fechado
    Quando eu clico no botão "+ Adicionar Registro"
    E clico no botão "Cancelar" do modal
    Subtítulo: o modal de registro deve ser fechado



Funcionalidade: Perfil do Profissional - Nexlar

  Contexto:
    Dado que eu acesso a página do Perfil do Profissional do Marcos Silva

  Cenário: Validar as informações e os blocos de conteúdo do perfil
    Então o título da página deve conter "Nexlar - Perfil do Profissional"
    E o cabeçalho deve exibir o nome "Marcos Silva", a tag "@construção" e a nota "4.8"
    E a localização deve mostrar "Centro, Camaçari - BA"
    E a seção "Sobre" deve conter "Mais de 15 anos de experiência."
    E o portfólio deve exibir exatamente 6 itens cadastrados

  Cenário: Avaliar o profissional utilizando o sistema de estrelas
    Dado que o texto de ajuda indica "Clique nas estrelas para avaliar"
    Quando eu clico na quarta estrela de avaliação
    Então a minha avaliação deve ser registrada com sucesso

  Cenário: Verificar os links de navegação e redirecionamento do perfil
    Então o botão "Enviar Mensagem" deve redirecionar para "painelmensagens.html"
    E o link da logo na barra de navegação deve apontar para "inicio.html"
    E o botão "Voltar" deve estar visível para o usuário