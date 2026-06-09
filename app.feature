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

    -----------------------------------------------------------------------------------------------------------------------------

Funcionalidade: Página de Homepage - Nexlar

Como um visitante interessado na plataforma Nexlar
Quero conhecer os recursos e funcionalidades da plataforma
Para decidir se desejo utilizá-la

Contexto:
Dado que eu acesse a Página de Homepage

Cenário: Clicar nos botões de cadastro
Quando eu clico no botão "Encontrar Profissional"
Então devo ser redirecionado para a página de cadastro de cliente

```
Quando eu clico no botão "Sou Profissional"
Então devo ser redirecionado para a página de cadastro de profissional
```

Cenário: Visualizar a seção de objetivos da plataforma
Quando eu desço pela página inicial
Então devo visualizar a seção de objetivos da Nexlar
E compreender a proposta da plataforma

Cenário: Visualizar a seção de passos de utilização
Quando eu desço pela página inicial
Então devo visualizar a seção de passos de utilização
E compreender como utilizar a plataforma

Cenário: Utilizar a calculadora de taxa
Quando eu acesso a seção "Calcule sua Taxa"
E eu informo os valores solicitados
Então o sistema deve exibir o valor calculado da taxa

Cenário: Visualizar a prévia da página inicial do aplicativo
Quando eu desço pela página inicial
Então devo visualizar a seção de apresentação do aplicativo
E compreender como será a experiência dentro da plataforma

Cenário: Visualizar a seção Sobre a Nexlar
Quando eu acesso a seção "Sobre a Nexlar"
Então devo visualizar informações institucionais da plataforma
E compreender sua missão e propósito

Cenário: Visualizar o rodapé do site
Quando eu chego ao final da página
Então devo visualizar o rodapé
E devo encontrar informações de contato e navegação da plataforma


    -----------------------------------------------------------------------------------------------------------------------------

  Funcionalidade: Página de Pagamento - Nexlar

  Cenário: Deve acessar e concluir o processo de pagamento com sucesso
   Dado que eu estou na página de Pagamento

   Quando eu seleciono uma forma de pagamento válida
   E eu preencho os dados obrigatórios do pagamento
   E eu clico no botão "Confirmar Pagamento"
   Então o sistema deve processar a solicitação de pagamento
   E eu devo visualizar a mensagem "Pagamento realizado com sucesso"

  Cenário: Deve impedir a confirmação com campos obrigatórios vazios
   Dado que eu estou na página de Pagamento

   Quando eu clico no botão "Confirmar Pagamento" sem preencher os dados obrigatórios
   Então o sistema deve exibir mensagens de validação dos campos obrigatórios

  Cenário: Deve retornar para a página anterior
   Dado que eu estou na página de Pagamento

   Quando eu clico no botão "Cancelar"
   Então eu devo ser redirecionado para a página anterior

  Cenário: Deve alterar a forma de pagamento
   Dado que eu estou na página de Pagamento

   Quando eu seleciono a opção "Cartão de Crédito"
   Então os campos de cartão devem ser exibidos

   Quando eu seleciono a opção "PIX"
   Então as informações de pagamento via PIX devem ser exibidas

    -----------------------------------------------------------------------------------------------------------------------------

  Funcionalidade: Meu Perfil - Nexlar

  Contexto:
    Dado que eu acesso a página "Meu Perfil" da Nexlar

  Cenário: Validar exibição inicial da página de perfil
    Então o título da página deve conter "Meu Perfil"
    E a descrição deve exibir "Gerencie suas informações e configurações"
    E o formulário de dados pessoais deve estar visível
    E o botão "Salvar Anotações" deve estar visível
    E as abas "Informações Pessoais" e "Portfólio" devem estar visíveis

  Cenário: Validar os dados pessoais do usuário
    Então o campo "Nome Completo" deve conter "João Pedro Silva"
    E o campo "Telefone" deve conter "(71) 98856-2546"
    E o campo "Email" deve conter "joaopedro@email.com"
    E o campo "Endereço / Bairro" deve conter "Centro, Campinas - SA"
    E o campo "Sobre você" deve conter "Eletricista com 10 anos de experiência."

  Cenário: Alternar para a aba Portfólio
    Quando eu clico na aba "Portfólio"
    Então a seção "Meu Portfólio" deve ser exibida
    E o texto "Adicione fotos e detalhes dos seus melhores trabalhos executados." deve estar visível
    E o formulário de dados pessoais deve ficar oculto

  Cenário: Voltar para a aba Informações Pessoais
    Dado que eu estou na aba "Portfólio"
    Quando eu clico na aba "Informações Pessoais"
    Então o formulário de dados pessoais deve ser exibido
    E a seção de portfólio deve ficar oculta

  Cenário: Salvar alterações do perfil com sucesso
    Quando eu altero o campo "Nome Completo" para "Maria Silva"
    E clico no botão "Salvar Anotações"
    Então o botão deve exibir o texto "Salvando..."
    E o botão deve ficar desabilitado
    E a mensagem "Anotações Salvas com Sucesso! ✓" deve ser exibida

  Cenário: Realizar upload de foto de perfil com sucesso
  Dado que estou na página "Meu Perfil"
  Quando eu clico no botão "Alterar Foto"
  E seleciono o arquivo "perfil.jpg"
  Então o avatar deve exibir a imagem carregada

  Cenário: Realizar logout com confirmação
    Quando eu clico no botão "Sair"
    E confirmo a ação de logout
    Então devo ser redirecionado para "index.html"

  Cenário: Cancelar logout
    Quando eu clico no botão "Sair"
    E cancelo a ação de logout
    Então devo permanecer na página "Meu Perfil"

  Cenário: Excluir conta com confirmação válida
    Quando eu clico no botão "Excluir Conta"
    E informo "DELETAR" na confirmação de exclusão
    Então devo visualizar o alerta "Sua conta foi removida de nossa base de dados."
    E devo ser redirecionado para "index.html"

  Cenário: Cancelar exclusão da conta com confirmação inválida
    Quando eu clico no botão "Excluir Conta"
    E informo "ABC123" na confirmação de exclusão
    Então devo visualizar o alerta "Palavra incorreta. A exclusão foi cancelada."

    -----------------------------------------------------------------------------------------------------------------------------

    Funcionalidade: Cadastro do Cliente - Nexlar

  Como um cliente da plataforma Nexlar
  Quero criar uma conta
  Para contratar serviços de profissionais autônomos

  Contexto:
    Dado que eu acesso a página de Cadastro do Cliente

  Cenário: Validar exibição dos campos de cadastro
    Então devo visualizar o campo "Nome completo"
    E devo visualizar o campo "Data de nascimento"
    E devo visualizar o campo "CPF"
    E devo visualizar o campo "Contato"
    E devo visualizar o campo "Senha"
    E devo visualizar o checkbox "Aceito os Termos de Uso"
    E devo visualizar o botão "Continuar"

  Cenário: Aplicar máscara de data
    Quando eu informo "01012000" no campo de nascimento
    Então o campo deve exibir "01/01/2000"

  Cenário: Aplicar máscara de CPF
    Quando eu informo "12345678909" no campo CPF
    Então o campo deve exibir "123.456.789-09"

  Cenário: Aplicar máscara de telefone
    Quando eu informo "71999998888" no campo contato
    Então o campo deve exibir "(71) 99999-8888"

  Cenário: Não permitir cadastro com CPF inválido
    Quando eu preencher o formulário com CPF inválido
    Então devo visualizar a mensagem "CPF inválido"

  Cenário: Não permitir cadastro com data inválida
    Quando eu preencher o formulário com data inválida
    Então devo visualizar a mensagem "Data de nascimento inválida"

  Cenário: Não permitir cadastro com senha menor que 6 caracteres
    Quando eu preencher o formulário com senha inválida
    Então devo visualizar a mensagem "A senha deve ter pelo menos 6 caracteres"

  Cenário: Não permitir cadastro sem aceitar os termos
    Quando eu preencher o formulário sem aceitar os termos
    Então o cadastro não deve ser concluído

  Cenário: Realizar cadastro com sucesso
    Quando eu preencher todos os campos corretamente
    E clicar no botão "Continuar"
    Então devo visualizar a mensagem "Cadastro realizado com sucesso"

  Cenário: Exibir mensagem de ajuda
    Quando eu clicar no botão de ajuda
    Então devo visualizar a orientação de preenchimento do cadastro

    -----------------------------------------------------------------------------------------------------------------------------

    Funcionalidade: Cadastro do Autônomo - Nexlar

  Como um profissional autônomo
  Quero realizar meu cadastro na plataforma
  Para oferecer meus serviços aos clientes

  Contexto:
    Dado que eu acesso a página de Cadastro do Autônomo

  Cenário: Validar exibição dos campos do formulário
    Então devo visualizar o título "Cadastro do Autônomo"
    E devo visualizar o campo "Nome completo"
    E devo visualizar o campo "Data de nascimento"
    E devo visualizar o campo "CPF"
    E devo visualizar o campo "Contato"
    E devo visualizar o campo "Senha"
    E devo visualizar o checkbox "Aceito os Termos de Uso"
    E devo visualizar o botão "Continuar"

  Cenário: Realizar cadastro com sucesso
    Quando eu preencho todos os campos com dados válidos
    E aceito os Termos de Uso
    E clico no botão "Continuar"
    Então devo visualizar a mensagem "Cadastro realizado com sucesso"

  Cenário: Tentar cadastrar sem preencher os campos
    Quando eu clico no botão "Continuar" sem preencher o formulário
    Então devo visualizar a mensagem "Preencha o nome completo"

  Cenário: Informar CPF inválido
    Quando eu preencho o formulário com um CPF inválido
    E clico no botão "Continuar"
    Então devo visualizar a mensagem "CPF inválido"

  Cenário: Informar senha menor que 6 caracteres
    Quando eu preencho o formulário com uma senha inválida
    E clico no botão "Continuar"
    Então devo visualizar a mensagem "A senha deve ter pelo menos 6 caracteres"

  Cenário: Solicitar ajuda
    Quando eu clico no botão de ajuda
    Então devo visualizar a mensagem "Preencha todos os campos para criar sua conta Nexlar"