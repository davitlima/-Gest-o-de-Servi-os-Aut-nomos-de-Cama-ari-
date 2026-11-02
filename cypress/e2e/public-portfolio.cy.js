describe('Portfólio público do profissional', () => {
  it('exibe imagem, descrição, preço e prazo de uma oferta salva', () => {
    cy.intercept('GET', '/src/js/api.js', { body: 'window.nexlarReady=Promise.resolve(window.__nexlarApi)' });
    cy.intercept('GET', '/portfolio.png', {
      statusCode: 200,
      headers: { 'content-type': 'image/png' },
      body: Cypress.Buffer.from('fake-image'),
    });
    cy.visit('/src/pages/perfilAutonomo.html?id=provider-1', { onBeforeLoad(win) {
      win.__nexlarApi = {
        request: async route => {
          if (route.startsWith('public/profile')) return {
            id: 'provider-1', role: 'autonomo', full_name: 'Ana Prestadora',
            service_category: 'Elétrica', neighborhood: 'Gleba A', bio: 'Instalações residenciais',
            avatar_url: null, reviews: [], portfolio_items: [{
              id: 4, image_url: '/portfolio.png', title: 'Instalação de quadro elétrico',
              description: 'Quadro elétrico instalado', price_mode: 'fixo', price: 480,
              estimated_duration: '1 dia útil',
            }],
          };
          throw new Error(`Rota inesperada: ${route}`);
        },
      };
    } });
    cy.get('#portfolio .portfolio-entry img').should('have.attr', 'src', '/portfolio.png');
    cy.get('#portfolio .portfolio-entry').should('contain', 'Instalação de quadro elétrico')
      .and('contain', 'Quadro elétrico instalado').and('contain', 'R$ 480,00').and('contain', 'Prazo estimado: 1 dia útil');
    cy.contains('#portfolio .portfolio-entry__contact', 'Conversar sobre este serviço')
      .should('have.attr', 'href', '/src/pages/painelmensagens.html?provider_id=provider-1');
    cy.viewport(390, 844);
    cy.get('.navbar').should('be.visible').invoke('outerHeight').should('be.at.most', 55);
    cy.contains('#portfolio .portfolio-entry__contact', 'Conversar sobre este serviço').should('be.visible');
    cy.get('#portfolio .portfolio-grid').invoke('css', 'grid-template-columns').should(columns => {
      expect(columns.match(/\d+(?:\.\d+)?px/g)).to.have.length(1);
    });
  });
});

