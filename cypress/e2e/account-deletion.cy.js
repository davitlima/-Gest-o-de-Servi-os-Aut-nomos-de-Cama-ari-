describe('Account deletion controls', () => {
  function visitProfile({ eligible = true } = {}) {
    cy.intercept('GET', '**/src/js/api.js', {
      headers: { 'content-type': 'application/javascript' },
      body: `window.__nexlarCalls = [];
        window.nexlarReady = Promise.resolve({
          requireSession: async () => ({ user: { id: 'test-account', email: 'test@example.test' } }),
          request: async (path, options = {}) => {
            window.__nexlarCalls.push({ path, method: options.method || 'GET' });
            if (path === 'me') return { id: 'test-account', role: 'cliente', full_name: 'Conta teste' };
            if (path === 'account/deletion-check') return { eligible: ${eligible} };
            if (path === 'account') {
              localStorage.setItem('account-delete-request', JSON.stringify({ method: options.method || 'GET', body: JSON.parse(options.body) }));
              return { deleted: true };
            }
            return [];
          },
          supabase: {
            auth: {
              signOut: async () => ({ error: null }),
              mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: 'aal1' }, error: null }) }
            },
            storage: { from: () => ({ list: async () => ({ data: [], error: null }), remove: async () => ({ error: null }) }) }
          }
        });
        window.dispatchEvent(new Event('nexlar:ready'));`
    });
    cy.intercept('GET', 'https://cdn.jsdelivr.net/npm/@supabase/**', { body: '' });
    cy.visit('/src/pages/Meuperfil.html');
  }

  it('keeps permanent account deletion inside the collapsed risk area and requires typed confirmation', () => {
    visitProfile();
    cy.get('.account-danger').should('not.have.attr', 'open');
    cy.get('#openAccountDeletion').should('not.be.visible');
    cy.contains('.account-danger summary', 'Zona de risco').click();
    cy.get('#openAccountDeletion').click();
    cy.get('#accountDeleteDialog').should('be.visible');
    cy.get('#confirmAccountDeletion').should('be.disabled');
    cy.get('#accountDeleteConfirmation').type('EXCLUIR');
    cy.get('#confirmAccountDeletion').should('be.enabled');
    cy.get('#cancelAccountDeletion').click();
    cy.get('#accountDeleteDialog').should('not.be.visible');
    cy.window().its('__nexlarCalls').should('not.deep.include', { path: 'account', method: 'DELETE' });
  });

  it('explains why an account with contract history cannot be self-deleted', () => {
    visitProfile({ eligible: false });
    cy.contains('.account-danger summary', 'Zona de risco').click();
    cy.get('#openAccountDeletion').click();
    cy.get('#accountDeleteConfirmation').type('EXCLUIR');
    cy.get('#confirmAccountDeletion').click();
    cy.get('#accountDeleteFeedback').should('contain.text', 'Há contratos associados');
    cy.get('#accountDeleteDialog').should('be.visible');
    cy.window().its('__nexlarCalls').should('not.deep.include', { path: 'account', method: 'DELETE' });
  });

  it('deletes an eligible account and signs out the local session', () => {
    visitProfile();
    cy.contains('.account-danger summary', 'Zona de risco').click();
    cy.get('#openAccountDeletion').click();
    cy.get('#accountDeleteConfirmation').type('EXCLUIR');
    cy.get('#confirmAccountDeletion').click();
    cy.location('pathname').should('eq', '/');
    cy.window().its('localStorage').invoke('getItem', 'account-delete-request').should('eq', JSON.stringify({ method: 'DELETE', body: { confirmation: 'EXCLUIR' } }));
  });
});

