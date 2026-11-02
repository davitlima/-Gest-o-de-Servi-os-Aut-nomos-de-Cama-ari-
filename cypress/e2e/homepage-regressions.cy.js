const publicProfessional = {
  id: 'provider-home-1',
  full_name: 'Profissional da Home',
  company_name: null,
  service_category: 'Pintura',
  neighborhood: 'Gleba A',
  bio: 'Atendimento local',
  avatar_url: null,
  reviews: [],
};

describe('Regressões da home e da navegação financeira', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/index.php?route=config', {
      body: { supabaseUrl: 'https://example.supabase.co', supabaseKey: 'test-key' },
    });
  });

  it('carrega os cartões de profissionais na home pública', () => {
    cy.intercept('GET', '**/api/index.php?route=public%2Fprofiles', {
      body: [publicProfessional],
    });

    cy.visit('/');

    cy.get('#cards .card').should('have.length', 1)
      .and('contain', 'Profissional da Home');
  });

  function visitInicioWithRole(role) {
    cy.intercept('GET', '/src/js/api.js', {
      body: 'window.nexlarReady=Promise.resolve(window.__nexlarApi)',
    });
    cy.intercept('GET', 'https://cdn.jsdelivr.net/npm/@supabase/**', { body: '' });

    cy.visit('/src/pages/inicio.html', {
      onBeforeLoad(win) {
        win.__nexlarApi = {
          request: async route => {
            if (route === 'me') return { id: 'account-1', role };
            throw new Error(`Rota inesperada: ${route}`);
          },
        };
      },
    });
  }

  it('oculta o acesso ao painel financeiro para uma conta cliente', () => {
    visitInicioWithRole('cliente');
    cy.get('#financePanelLink').should('not.be.visible');
  });

  for (const role of ['autonomo', 'empresa']) {
    it(`mostra o acesso ao painel financeiro para ${role}`, () => {
      visitInicioWithRole(role);
      cy.get('#financePanelLink').should('be.visible');
    });
  }
});
