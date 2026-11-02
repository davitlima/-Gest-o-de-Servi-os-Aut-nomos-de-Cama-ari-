describe('Ajuda no cadastro', () => {
  it('exibe a orientação sem depender de uma função global ausente', () => {
    cy.intercept('GET', '/src/js/api.js', { body: 'window.nexlarReady=Promise.resolve(window.__nexlarApi)' });
    cy.visit('/src/pages/cadastroautonomo.html', { onBeforeLoad(win) {
      win.__nexlarApi = {
        supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
      };
      Object.defineProperty(win, 'supabase', { configurable: true, value: { createClient: () => win.__nexlarApi.supabase } });
    } });

    cy.get('.btn-help').click();
    cy.get('#toast').should('contain', 'Preencha todos os campos para criar sua conta Nexlar.');
  });
});
