describe('Navegação dos cadastros para o login', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/index.php?route=config', {
      body: { supabaseUrl: 'https://example.supabase.co', supabaseKey: 'test-key' },
    });
    cy.intercept('GET', 'https://cdn.jsdelivr.net/npm/@supabase/**', {
      body: 'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}})}})}',
    });
  });

  const signupPages = [
    ['cadastroautonomo.html', 'Cadastro do Autônomo'],
    ['cadastroempresa.html', 'Cadastro da Empresa'],
    ['cadastrocliente.html', 'Cadastro do Cliente'],
  ];

  signupPages.forEach(([page, title]) => {
    it(`oferece retorno ao login em ${title}`, () => {
      cy.visit(`/src/pages/${page}`);

      cy.get('.signup-login-link')
        .should('be.visible')
        .and('have.attr', 'href', '/src/pages/login.html')
        .and('contain', 'Entrar');
    });
  });

  it('mantém o acesso ao login após criar a conta', () => {
    cy.intercept('GET', '/src/js/api.js', {
      body: 'window.nexlarReady=Promise.resolve(window.__nexlarApi)',
    });
    cy.visit('/src/pages/cadastroautonomo.html', {
      onBeforeLoad(win) {
        win.__nexlarApi = {
          supabase: {
            auth: {
              signUp: async () => ({ error: null }),
              signOut: async () => ({ error: null }),
              getSession: async () => ({ data: { session: null } }),
            },
          },
        };
      },
    });

    cy.get('#nome').type('Ana Profissional');
    cy.get('#nascimento').type('01011990');
    cy.get('#cpf').type('12345678901');
    cy.get('#contato').type('71912345678');
    cy.get('#email').type('ana@example.test');
    cy.get('#senha').type('Strong!Pass1');
    cy.get('#confirmarSenha').type('Strong!Pass1');
    cy.get('#serviceCategory').select('Pintura');
    cy.get('#providerNeighborhood').select('Gleba A');
    cy.get('#termos').check();
    cy.get('#btnContinuar').click();

    cy.get('#toast').should('contain', 'Cadastro criado');
    cy.get('.signup-login-link').should('be.visible')
      .and('have.attr', 'href', '/src/pages/login.html');
  });
});
