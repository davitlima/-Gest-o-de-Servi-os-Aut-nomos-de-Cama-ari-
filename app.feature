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


-----------------------------------------------------------------------------------------------------------------------------
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
    -------------------------------------------------------------------------------


Funcionalidade: Painel de Mensagens - Nexlar
  Como um usuário da plataforma Nexlar
  Quero interagir com o painel de mensagens
  Para visualizar conversas, buscar contatos e enviar novas mensagens

  Contexto:
    Dado que eu acesso a página de mensagens da Nexlar

  Cenário: Validar exibição inicial do painel de mensagens
    Então devo ver o menu lateral com o item "Mensagem" ativo
    E a lista de conversas deve exibir os contatos "Maria Santos", "Carlos Fabrício" e "Ana Paula"
    E a área do chat deve exibir a mensagem "Selecione uma conversa"

  Cenário: Selecionar uma conversa e abrir o chat
    Quando eu clico na conversa com "Maria Santos"
    Então o estado vazio de "Selecione uma conversa" deve sumir
    E o cabeçalho do chat deve exibir o nome "Maria Santos" com o status "Online"
    E a bolinha de mensagem não lida deve desaparecer da lista

  Cenário: Buscar por uma conversa específica
    Quando eu digito "Carlos" no campo de busca
    Então apenas a conversa de "Carlos Fabrício" deve ser exibida na lista
    E as conversas de "Maria Santos" e "Ana Paula" devem ficar ocultas

  Cenário: Enviar uma nova mensagem com sucesso
    Dado que eu abri a conversa com "Maria Santos"
    Quando eu digito "Olá, estarei aí no horário combinado!" no campo de texto
    E clico no botão de enviar
    Então a nova mensagem deve ser adicionada à área de exibição do chat

  Cenário: Interagir com o botão de contratação de serviço
    Dado que eu abri a conversa com "Carlos Fabrício"
    Quando eu clico no botão "Contratar Serviço"
    Então a ação de contratação deve ser disparada
    -----------------------------------------------------------------------------------------------------------------------------
Funcionalidade: Tela Inicial de Serviços - Nexlar
  Como um cliente na plataforma Nexlar em Camaçari
  Quero buscar, filtrar e navegar pelos profissionais autônomos
  Para encontrar o prestador de serviço ideal para a minha necessidade

  Contexto:
    Dado que eu acesso a página inicial da Nexlar

  Cenário: Validar elementos e carregamento inicial dos cards
    Então o título principal deve exibir "Encontre quem faz direito."
    E devo visualizar a listagem com todos os profissionais disponíveis
    E os campos de filtro por "Serviço" e "Bairro" devem estar limpos

  Cenário: Filtrar profissionais por categoria através dos botões de atalho
    Quando eu clico no botão de categoria "Elétrica"
    Então a listagem deve exibir apenas profissionais com a tag "@elétrica"
    E o profissional "Sofia Paiva" deve estar visível

  Cenário: Filtrar profissionais utilizando os seletores combinados (Selects)
    Quando eu seleciono o serviço "Hidráulica" no filtro
    E seleciono o bairro "Inocoop" no filtro de região
    Então apenas o card de "Carlos Oliveira" deve ser exibido na tela
    E o card de "Tiago Souza" que é de "Gleba A" deve ficar oculto

  Cenário: Buscar por nome do profissional através da barra de pesquisa
    Quando eu digito "Marcos Silva" na barra de busca superior
    Então apenas o card do profissional "Marcos Silva" deve ser exibido

  Cenário: Navegar para o perfil detalhado do autônomo
    Quando eu clico no corpo do card do profissional "Sofia Paiva"
    Então eu devo ser redirecionado para a página "perfilAutonomo.html"

  Cenário: Redirecionar para o chat ao clicar em enviar mensagem
    Quando eu clico no botão "Enviar mensagem" do card de "Marcos Silva"
    Então o clique no card não deve ser disparado
    E eu devo ser redirecionado para a página "painelmensagens.html"