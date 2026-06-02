describe('Tela Inicial - Nexlar', () => {

  beforeEach(() => {
    // Altere para a URL correspondente ao seu ambiente local ou de deploy
    cy.visit('/src/pages/inicio.html');
  });

  it('Deve validar os componentes principais do cabeçalho e da seção hero', () => {
    // Verifica título de impacto
    cy.get('.hero h1').should('have.text', 'Encontre quem faz direito.');

    // Verifica se os selects de filtro carregaram corretamente os estados iniciais
    cy.get('#sel-servico').should('have.value', '');
    cy.get('#sel-bairro').should('have.value', '');

    // Garante que todos os 12 cards mocados no HTML inicial foram renderizados
    cy.get('#cards .card').should('have.length', 12);
  });

  it('Deve filtrar os profissionais ao clicar em uma categoria rápida', () => {
    // Clica no botão de atalho de Elétrica
    cy.get('.categories .cat').contains('Elétrica').click();

    // Filtra e valida se apenas cards de elétrica ficaram visíveis
    cy.get('#cards .card:visible').each(($card) => {
      cy.wrap($card).should('have.attr', 'data-cat', 'eletrica');
    });

    cy.get('#cards .card').contains('Sofia Paiva').should('be.visible');
    cy.get('#cards .card').contains('Marcos Silva').should('not.be.visible');
  });

  it('Deve realizar a filtragem combinando serviço e bairro nos selects', () => {
    // Seleciona categoria Hidráulica
    cy.get('#sel-servico').select('hidraulica');
    // Seleciona o bairro mapeado dentro do optgroup Sede
    cy.get('#sel-bairro').select('inocoop');

    /**
     * NOTA: Este teste assume que o seu arquivo 'inicio.js' adiciona regras 
     * de display ou classes de ocultação no evento 'change' dos selects.
     */
    cy.get('#cards .card:visible').should('have.length', 1);
    cy.get('#cards .card:visible').within(() => {
      cy.get('strong').should('have.text', 'Carlos Oliveira');
      cy.get('.loc').should('contain.text', 'Inocoop');
    });

    // Tiago Souza também é hidráulica, mas é da Gleba A, logo deve sumir
    cy.get('#cards .card').contains('Tiago Souza').should('not.be.visible');
  });

  it('Deve buscar profissionais de forma dinâmica digitando na barra de pesquisa', () => {
    cy.get('#search-input').type('Marcos');

    // Valida o comportamento esperado da busca
    cy.get('#cards .card:visible').should('have.length', 1);
    cy.get('#cards .card:visible strong').should('have.text', 'Marcos Silva');
  });

  it('Deve redirecionar para a página do perfil do profissional ao clicar no card', () => {
    // Como os redirecionamentos nativos mudam a origem da página, vamos apenas 
    // interceptar e validar se o clique tenta direcionar para o local certo.
    // O Cypress pode travar se mudar para uma página sem o ambiente configurado.
    
    // Alvo: Card do Roberto Alencar
    cy.get('#cards .card').contains('Roberto Alencar').closest('.card').as('cardAlencar');

    // Verifica se o atributo de clique ou redirecionamento padrão está mapeado
    cy.get('@cardAlencar')
      .should('have.attr', 'onclick')
      .and('include', "location.href='perfilAutonomo.html'");
  });

  it('Deve abrir a tela de mensagens com stopPropagation correto ao clicar em Enviar Mensagem', () => {
    // Busca o botão interno do card da Sofia Paiva
    cy.get('#cards .card')
      .contains('Sofia Paiva')
      .closest('.card')
      .find('.btn-msg')
      .as('botaoMensagem');

    // Valida se o botão possui o atributo correto contendo o nome do profissional
    cy.get('@botaoMensagem').should('have.attr', 'data-name', 'Sofia Paiva');

    // Valida se o link pai do botão redireciona para a central de chats
    cy.get('@botaoMensagem')
      .closest('a')
      .should('have.attr', 'href', 'painelmensagens.html');
      
    // Valida que o link impede a bolha de clique de ativar o link do card
    cy.get('@botaoMensagem')
      .closest('a')
      .should('have.attr', 'onclick', 'event.stopPropagation();');
  });
});gity