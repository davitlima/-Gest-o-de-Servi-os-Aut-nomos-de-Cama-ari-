describe('Shared panel navigation layout', () => {
  function visitPanel(page, role = 'cliente') {
    cy.intercept('GET', '**/src/js/api.js', {
      headers: { 'content-type': 'application/javascript' },
      body: `window.nexlarReady = Promise.resolve({
        requireSession: async () => ({ user: { email: 'layout@example.test' } }),
        request: async path => path === 'me' ? { id: 'client', role: '${role}', full_name: 'Layout User' }
          : path === 'conversations' ? Array.from({length: 30}, (_, i) => ({
              id: String(i), client_id: 'client', provider_id: 'provider',
              provider: {full_name: 'Contact ' + i}, updated_at: '2026-10-31T12:00:00Z'
            })) : [],
        supabase: {
          channel: () => ({ on() { return this; }, subscribe() { return this; } }),
          removeChannel: async () => {}
        }
      });`
    });
    cy.intercept('GET', 'https://cdn.jsdelivr.net/npm/@supabase/**', { body: '' });
    cy.visit('/src/pages/' + page + '.html');
  }

  for (const [width, height] of [[320, 568], [390, 844]]) {
    it(`keeps the last conversation and chat controls reachable at ${width}x${height}`, () => {
      cy.viewport(width, height);
      visitPanel('painelmensagens');
      cy.get('#conversationList').scrollTo('bottom');
      cy.get('.conversation-item').last().should('be.visible').click();
      cy.get('#chatInput').should('be.visible');
      cy.get('#contratarBtn').should('be.visible');
      cy.get('#contratarBtn').then($button => {
        const rect = $button[0].getBoundingClientRect();
        expect(rect.bottom).to.be.at.most(height);
      });
      cy.get('.panel-nav__trigger').click();
      cy.get('.panel-nav__link').should('have.length', 3);
      cy.get('.panel-nav__link[href="Painelfinanceiro.html"]').should('not.exist');
      cy.get('.panel-nav__close').click();
      cy.get('#backBtn').click();
      cy.get('.conversation-item').last().should('be.visible');
    });

    it(`keeps profile content and drawer usable at ${width}x${height}`, () => {
      cy.viewport(width, height);
      visitPanel('Meuperfil');
      cy.get('.panel-nav__trigger').click();
      cy.get('.panel-nav__link[href="Painelfinanceiro.html"]').should('not.exist');
      cy.get('.panel-nav__close').click();
      cy.get('.btn-save').scrollIntoView().should('be.visible');
      cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(width));
    });
  }

  it('keeps profile content usable with the desktop navigation at 800px', () => {
    cy.viewport(800, 900);
    visitPanel('Meuperfil');
    cy.get('.panel-nav__sidebar').should('be.visible');
    cy.get('.profile-card').should('be.visible');
    cy.get('.btn-save').scrollIntoView().should('be.visible');
    cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(800));
  });

  it('shows Financeiro in the navigation for provider accounts', () => {
    cy.viewport(1280, 900);
    visitPanel('Meuperfil', 'empresa');
    cy.get('.panel-nav__link[href="Painelfinanceiro.html"]').should('be.visible');
  });
});

