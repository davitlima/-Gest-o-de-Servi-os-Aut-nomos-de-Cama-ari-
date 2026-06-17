describe('Tela Inicial - Nexlar', () => {

  beforeEach(() => {
    
    cy.visit('/src/pages/inicio.html');
  });

  it('Deve validar os componentes principais do cabeçalho e da seção hero', () => {
  
    cy.get('.hero h1').should('have.text', 'Encontre quem faz direito.');


    cy.get('#sel-servico').should('have.value', '');
    cy.get('#sel-bairro').should('have.value', '');

    cy.get('#cards .card').should('have.length', 12);
  });

  it('Deve filtrar os profissionais ao clicar em uma categoria rápida', () => {
  
    cy.get('.categories .cat').contains('Elétrica').click();

   
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
   
   
    cy.get('#cards .card').contains('Roberto Alencar').closest('.card').as('cardAlencar');

    cy.get('@cardAlencar')
      .should('have.attr', 'onclick')
      .and('include', "location.href='perfilAutonomo.html'");
  });

  it('Deve abrir a tela de mensagens com stopPropagation correto ao clicar em Enviar Mensagem', () => {
    
    cy.get('#cards .card')
      .contains('Sofia Paiva')
      .closest('.card')
      .find('.btn-msg')
      .as('botaoMensagem');

    cy.get('@botaoMensagem').should('have.attr', 'data-name', 'Sofia Paiva');

    
    cy.get('@botaoMensagem')
      .closest('a')
      .should('have.attr', 'href', 'painelmensagens.html');
   
    cy.get('@botaoMensagem')
      .closest('a')
      .should('have.attr', 'onclick', 'event.stopPropagation();');
  });
});gity