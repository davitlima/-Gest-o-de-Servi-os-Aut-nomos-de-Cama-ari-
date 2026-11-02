describe('Acesso ao painel financeiro por tipo de conta', () => {
  function visitFinance(role) {
    cy.intercept('GET', '/src/js/api.js', { body: 'window.nexlarReady=Promise.resolve(window.__nexlarApi)' });
    cy.intercept('GET', 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/**', {
      body: 'window.Chart=class { constructor() { this.data={datasets:[{data:[]}]}; this.options={}; } update() {} }',
    });
    cy.intercept('GET', 'https://cdn.jsdelivr.net/npm/@supabase/**', { body: '' });
    cy.visit('/src/pages/Painelfinanceiro.html', { onBeforeLoad(win) {
      win.localStorage.removeItem('nexlar-test-finance-requests');
      const session = { user: { id: 'account-1', email: 'account@example.test' } };
      win.__nexlarApi = {
        requireSession: async () => session,
        request: async route => {
          const requests = JSON.parse(win.localStorage.getItem('nexlar-test-finance-requests') || '[]');
          requests.push(route);
          win.localStorage.setItem('nexlar-test-finance-requests', JSON.stringify(requests));
          if (route === 'me') return { id: 'account-1', role, full_name: 'Conta teste' };
          if (route === 'finance') return [];
          if (route === 'finance/goal') return { amount: 0 };
          throw new Error(`Unexpected route ${route}`);
        },
      };
    } });
  }

  it('redireciona clientes antes de solicitar dados financeiros', () => {
    visitFinance('cliente');
    cy.location('pathname').should('include', 'inicio.html');
    cy.window().should(win => {
      const requests = JSON.parse(win.localStorage.getItem('nexlar-test-finance-requests') || '[]');
      expect(requests).to.include('me');
      expect(requests).not.to.include('finance');
      expect(requests).not.to.include('finance/goal');
    });
  });

  for (const role of ['autonomo', 'empresa']) {
    it(`carrega os dados para ${role}`, () => {
      visitFinance(role);
      cy.window().should(win => {
        const requests = JSON.parse(win.localStorage.getItem('nexlar-test-finance-requests') || '[]');
        expect(requests).to.include('finance');
        expect(requests).to.include('finance/goal');
      });
      cy.get('#historyList').should('be.visible');
    });
  }
});
