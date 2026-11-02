describe('Portfólio público do profissional', () => {
  it('exibe a imagem salva e sua descrição opcional', () => {
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
              id: 4, image_url: '/portfolio.png', description: 'Quadro elétrico instalado',
            }],
          };
          throw new Error(`Rota inesperada: ${route}`);
        },
      };
    } });
    cy.get('#portfolio .portfolio-entry img').should('have.attr', 'src', '/portfolio.png');
    cy.get('#portfolio .portfolio-entry figcaption').should('contain', 'Quadro elétrico instalado');
  });
});
