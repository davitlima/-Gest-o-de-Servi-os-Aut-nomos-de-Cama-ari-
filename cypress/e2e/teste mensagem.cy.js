describe('Painel de Mensagens - Nexlar', () => {
  
  beforeEach(() => {
   
    cy.visit('/src/pages/painelmensagens.html'); 
  });

  it('Deve validar a exibição inicial do painel', () => {

    cy.get('.nav-item.active').should('contain.text', 'Mensagem');

    cy.get('#conversationList .conversation-item').should('have.length', 3);
    cy.get('#conversationList').toNot;
    cy.get('.conv-name').eq(0).should('have.text', 'Maria Santos');
    cy.get('.conv-name').eq(1).should('have.text', 'Carlos Fabrício');
    cy.get('.conv-name').eq(2).should('have.text', 'Ana Paula');

    cy.get('#emptyState').should('be.visible');
    cy.get('#chatView').should('not.be.visible');
  });

  it('Deve abrir uma conversa ao clicar em um contato e limpar notificações', () => {
    // Verifica que o primeiro item tem a classe unread e a bolinha
    cy.get('.conversation-item[data-id="1"]').should('have.class', 'unread');
    cy.get('.conversation-item[data-id="1"] .unread-dot').should('be.visible');

   
    cy.get('.conversation-item[data-id="1"]').click();

    cy.get('#emptyState').should('not.be.visible');
    cy.get('#chatView').should('be.visible');

    cy.get('#chatHeaderName').should('have.text', 'Maria Santos');
    cy.get('#chatHeader .chat-header-status').should('have.text', 'Online');

    cy.get('.conversation-item[data-id="1"]').should('not.have.class', 'unread');
  });

  it('Deve filtrar a lista de conversas pelo campo de busca', () => {

    cy.get('#searchInput').type('Carlos');

   
    cy.get('.conversation-item').contains('Carlos Fabrício').should('be.visible');
    cy.get('.conversation-item').contains('Maria Santos').should('not.be.visible');
    cy.get('.conversation-item').contains('Ana Paula').should('not.be.visible');
  });

  it('Deve permitir digitar e enviar uma mensagem', () => {
   
    cy.get('.conversation-item[data-id="1"]').click();

    const textoMensagem = 'Perfeito, combinado!';

    cy.get('#chatInput').type(textoMensagem);
    cy.get('#sendBtn').click();

 
    cy.get('#chatInput').should('have.value', '');


    cy.get('#chatMessages').should('contain.text', textoMensagem);
  });

  it('Deve clicar no botão de contratar serviço', () => {
   
    cy.get('.conversation-item[data-id="2"]').click();

    cy.get('#contratarBtn')
      .should('be.visible')
      .and('contain.text', 'Contratar Serviço')
      .click();
      
  });

  it('Deve validar o comportamento responsivo do menu lateral (Mobile)', () => {
 
    cy.viewport('iphone-xr');

    cy.get('.mobile-header').should('be.visible');
    
    
    cy.get('#hamburger').click();
    
   
    cy.get('#sidebar').should('be.visible');
    
    cy.get('#sidebarClose').click();
    cy.get('#sidebar').should('not.be.visible');
  });
});