describe('Painel de Mensagens - Nexlar', () => {
  
  beforeEach(() => {
    // Substitua pela URL correta do seu ambiente local ou de staging
    cy.visit('/src/pages/painelmensagens.html'); 
  });

  it('Deve validar a exibição inicial do painel', () => {
    // Verifica menu ativo
    cy.get('.nav-item.active').should('contain.text', 'Mensagem');

    // Verifica se a lista de conversas renderizou os contatos mockados no HTML
    cy.get('#conversationList .conversation-item').should('have.length', 3);
    cy.get('#conversationList').toNot;
    cy.get('.conv-name').eq(0).should('have.text', 'Maria Santos');
    cy.get('.conv-name').eq(1).should('have.text', 'Carlos Fabrício');
    cy.get('.conv-name').eq(2).should('have.text', 'Ana Paula');

    // Verifica estado vazio inicial da área de chat
    cy.get('#emptyState').should('be.visible');
    cy.get('#chatView').should('not.be.visible');
  });

  it('Deve abrir uma conversa ao clicar em um contato e limpar notificações', () => {
    // Verifica que o primeiro item tem a classe unread e a bolinha
    cy.get('.conversation-item[data-id="1"]').should('have.class', 'unread');
    cy.get('.conversation-item[data-id="1"] .unread-dot').should('be.visible');

    // Clica na conversa da Maria Santos (data-id="1")
    cy.get('.conversation-item[data-id="1"]').click();

    // Valida transição de telas na área do chat
    cy.get('#emptyState').should('not.be.visible');
    cy.get('#chatView').should('be.visible');

    // Valida dados do cabeçalho
    cy.get('#chatHeaderName').should('have.text', 'Maria Santos');
    cy.get('#chatHeader .chat-header-status').should('have.text', 'Online');

    /**
     * NOTA: Para o teste abaixo passar 100%, o seu arquivo 'painelmensagens.js' 
     * deve remover a classe 'unread' e o '.unread-dot' ao clicar no elemento.
     */
    cy.get('.conversation-item[data-id="1"]').should('not.have.class', 'unread');
  });

  it('Deve filtrar a lista de conversas pelo campo de busca', () => {
    // Digita o nome de um contato específico
    cy.get('#searchInput').type('Carlos');

    /**
     * NOTA: Este teste assume que seu JS adiciona uma classe (ex: .hidden) 
     * ou altera o display via JS na busca. Ajuste conforme sua lógica de filtro.
     */
    cy.get('.conversation-item').contains('Carlos Fabrício').should('be.visible');
    cy.get('.conversation-item').contains('Maria Santos').should('not.be.visible');
    cy.get('.conversation-item').contains('Ana Paula').should('not.be.visible');
  });

  it('Deve permitir digitar e enviar uma mensagem', () => {
    // Abre a conversa
    cy.get('.conversation-item[data-id="1"]').click();

    const textoMensagem = 'Perfeito, combinado!';

    // Digita e envia a mensagem
    cy.get('#chatInput').type(textoMensagem);
    cy.get('#sendBtn').click();

    // Valida se o input foi limpo após o envio
    cy.get('#chatInput').should('have.value', '');

    // Valida se a mensagem apareceu na tela de chat
    cy.get('#chatMessages').should('contain.text', textoMensagem);
  });

  it('Deve clicar no botão de contratar serviço', () => {
    // Abre a conversa
    cy.get('.conversation-item[data-id="2"]').click();

    // Verifica e clica no botão de contratação
    cy.get('#contratarBtn')
      .should('be.visible')
      .and('contain.text', 'Contratar Serviço')
      .click();
      
    // Aqui você pode adicionar um spy/stub ou checar se abriu um modal futuramente
  });

  it('Deve validar o comportamento responsivo do menu lateral (Mobile)', () => {
    // Altera a resolução para simular um smartphone
    cy.viewport('iphone-xr');

    // O header mobile deve estar visível e o menu lateral oculto (baseado em classes CSS padrão)
    cy.get('.mobile-header').should('be.visible');
    
    // Clica no botão hambúrguer para abrir o menu
    cy.get('#hamburger').click();
    
    // Verifica se o sidebar ou o overlay ficou visível (ajuste a classe conforme seu CSS)
    cy.get('#sidebar').should('be.visible');
    
    // Fecha o menu pelo botão de fechar
    cy.get('#sidebarClose').click();
    cy.get('#sidebar').should('not.be.visible');
  });
});