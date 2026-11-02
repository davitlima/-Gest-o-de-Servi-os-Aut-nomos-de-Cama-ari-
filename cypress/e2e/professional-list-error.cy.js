const professionals = [{
  id: 'provider-1', full_name: 'Ana Prestadora', company_name: null,
  service_category: 'Elétrica', neighborhood: 'Gleba A', bio: 'Instalações',
  avatar_url: null, reviews: [],
}];

describe('Recuperação da lista pública de profissionais', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/index.php?route=config', {
      body: { supabaseUrl: 'https://example.supabase.co', supabaseKey: 'test-key' },
    });
  });

  it('permite tentar novamente após falha HTTP e carrega os cartões', () => {
    let attempts = 0;
    cy.intercept('GET', '**/api/index.php?route=public%2Fprofiles', req => {
      attempts += 1;
      req.reply(attempts === 1
        ? { statusCode: 503, body: { error: 'Indisponível' } }
        : { statusCode: 200, body: professionals });
    }).as('professionals');

    cy.visit('/src/pages/inicio.html');
    cy.wait('@professionals');
    cy.contains('#cards', 'Não foi possível carregar os profissionais agora.').should('be.visible');
    cy.get('#retry-professionals').should('be.visible').and('be.enabled').click();
    cy.wait('@professionals');
    cy.get('#cards .card').should('have.length', 1).and('contain', 'Ana Prestadora');
    cy.get('#retry-professionals').should('not.exist');
  });

  it('explica resposta inválida e mantém uma ação de recuperação', () => {
    cy.intercept('GET', '**/api/index.php?route=public%2Fprofiles', { body: { profiles: professionals } });
    cy.visit('/src/pages/inicio.html');
    cy.contains('#cards', 'A resposta recebida não está no formato esperado.').should('be.visible');
    cy.get('#retry-professionals').should('be.visible');
  });
});
