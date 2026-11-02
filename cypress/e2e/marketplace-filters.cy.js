const professionals = [
  { id: 'p1', full_name: 'João Silva', company_name: null, service_category: 'Elétrica', neighborhood: 'Gleba A', bio: 'Instalação e manutenção', avatar_url: '/avatar-valid.svg', reviews: [] },
  { id: 'p2', full_name: 'Maria Costa', company_name: null, service_category: 'Hidráulica', neighborhood: 'Centro', bio: 'Reparo de torneiras', avatar_url: '/avatar-broken.svg', reviews: [] },
  { id: 'p3', full_name: 'Pedro Lima', company_name: null, service_category: 'Elétrica', neighborhood: 'Ponto-Certo', bio: 'Eletricista residencial', avatar_url: null, reviews: [] },
];

describe('Busca e filtros da lista pública', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/index.php?route=public%2Fprofiles', { body: professionals });
    cy.intercept('GET', '**/api/index.php?route=config', {
      body: { supabaseUrl: 'https://example.supabase.co', supabaseKey: 'test-key' },
    });
    cy.intercept('GET', '/avatar-valid.svg', {
      statusCode: 200, headers: { 'content-type': 'image/svg+xml' },
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="20" fill="blue"/></svg>',
    });
    cy.intercept('GET', '/avatar-broken.svg', { statusCode: 404, body: '' });
    cy.visit('/src/pages/inicio.html');
    cy.get('#cards .card').should('have.length', 3);
  });

  it('combina busca sem acentos, serviço e bairro com hífen', () => {
    cy.get('#search-input').type('manutencao');
    cy.get('#sel-servico').select('eletrica');
    cy.get('#sel-bairro').select('gleba-a');
    cy.get('#cards .card:visible').should('have.length', 1).and('contain', 'João Silva');
    cy.get('#results-count').should('contain', '1 profissional');
    cy.get('.cat[data-cat="eletrica"]').should('have.class', 'active');
  });

  it('sincroniza categoria, mostra estado vazio e limpa os filtros', () => {
    cy.get('.cat[data-cat="eletrica"]').click();
    cy.get('#sel-servico').should('have.value', 'eletrica');
    cy.get('#search-input').type('não existe');
    cy.get('#no-results').should('be.visible');
    cy.get('#clear-filters').click();
    cy.get('#search-input').should('have.value', '');
    cy.get('#cards .card:visible').should('have.length', 3);
    cy.get('#clear-filters').should('not.be.visible');
    cy.get('.cat').contains('Todos os serviços').click();
    cy.get('#sel-servico').should('have.value', '');
  });

  it('usa fallback apenas quando a foto está ausente ou falha', () => {
    cy.get('[data-profile-id="p1"] .av').should('have.class', 'has-photo')
      .find('.avatar-fallback').should('have.css', 'visibility', 'hidden');
    cy.get('[data-profile-id="p2"] .av').should('not.have.class', 'has-photo')
      .find('.avatar-fallback').should('be.visible');
    cy.get('[data-profile-id="p3"] .av').find('.avatar-fallback').should('be.visible');
  });

  it('mantém a busca visível em tela de celular', () => {
    cy.viewport(390, 844);
    cy.get('#search-input').should('be.visible');
  });

  it('limita a largura dos cartões em desktop e preserva colunas separadas', () => {
    cy.viewport(1280, 800);
    cy.get('#cards .card').then($cards => {
      const first = $cards[0].getBoundingClientRect();
      const second = $cards[1].getBoundingClientRect();
      expect(first.width).to.be.at.most(420);
      expect(second.width).to.be.at.most(420);
      expect(second.left).to.be.at.least(first.right);
      expect(second.top).to.equal(first.top);
    });
    cy.contains('#cards .card', 'Maria Costa').should('be.visible');
  });

  it('usa os mesmos filtros na homepage pública', () => {
    cy.visit('/');
    cy.get('#cards .card').should('have.length', 3);
    cy.get('#sel-bairro').select('gleba-a');
    cy.get('#cards .card:visible').should('have.length', 1).and('contain', 'João Silva');
  });
});

describe('Cadastro de prestador', () => {
  it('solicita serviço e bairro canônicos no cadastro autônomo e empresarial', () => {
    cy.intercept('GET', '/src/js/api.js', { body: 'window.nexlarReady=Promise.resolve({supabase:{auth:{signUp:async()=>({error:null}),signOut:async()=>({error:null})}}})' });
    for (const path of ['cadastroautonomo.html', 'cadastroempresa.html']) {
      cy.visit(`/src/pages/${path}`, { onBeforeLoad(win) { win.__nexlarApi = { supabase: { auth: { signUp: async () => ({ error: null }), signOut: async () => ({ error: null }) } } }; } });
      cy.get('#serviceCategory').should('have.attr', 'required');
      cy.get('#serviceCategory option').should('contain', 'Elétrica');
      cy.get('#providerNeighborhood').should('have.attr', 'required');
      cy.get('#providerNeighborhood option').should('contain', 'Gleba A');
    }
  });

  it('envia serviço e bairro nos metadados de autônomos e empresas', () => {
    cy.intercept('GET', '/src/js/api.js', { body: 'window.nexlarReady=Promise.resolve(window.__nexlarApi)' });
    for (const account of [
      { path: 'cadastroautonomo.html', documentId: 'cpf', documentValue: '52998224725' },
      { path: 'cadastroempresa.html', documentId: 'cnpj', documentValue: '12345678000190' },
    ]) {
      cy.visit(`/src/pages/${account.path}`, { onBeforeLoad(win) {
        win.__nexlarApi = { supabase: { auth: {
          signUp: async options => { win.__signupOptions = options; return { error: null }; },
          signOut: async () => ({ error: null }),
        } } };
      } });
      cy.get('#nome').type('Prestador Teste');
      cy.get('#nascimento').type('01011990');
      cy.get(`#${account.documentId}`).type(account.documentValue);
      cy.get('#contato').type('71999999999');
      cy.get('#email').type(`test-${account.path}@example.com`);
      cy.get('#senha').type('Senha123!');
      cy.get('#confirmarSenha').type('Senha123!');
      cy.get('#serviceCategory').select('Elétrica');
      cy.get('#providerNeighborhood').select('Gleba A');
      cy.get('#termos').check();
      cy.get('#btnContinuar').click();
      cy.window().its('__signupOptions.options.data').should('include', {
        role: account.path === 'cadastroempresa.html' ? 'empresa' : 'autonomo',
        service_category: 'Elétrica', neighborhood: 'Gleba A',
      });
    }
  });
});

describe('Edição do perfil profissional', () => {
  beforeEach(() => {
    cy.intercept('GET', '/src/js/api.js', { body: 'window.nexlarReady=Promise.resolve(window.__nexlarApi)' });
  });

  it('permite alterar serviço e bairro e envia os nomes visíveis', () => {
    cy.visit('/src/pages/Meuperfil.html', { onBeforeLoad(win) {
      const session = { user: { id: 'provider-1', email: 'ana@example.com' }, access_token: 'test-token' };
      win.__nexlarApi = {
        supabase: { auth: { signOut: async () => ({ error: null }) } },
        requireSession: async () => session,
        request: async (route, options) => {
          if (route === 'me' && !options) return { id: 'provider-1', role: 'autonomo', full_name: 'Ana Prestadora', phone: '', neighborhood: 'Gleba A', service_category: 'Elétrica', bio: '', avatar_url: null };
          if (route === 'portfolio') return [];
          if (route === 'me' && options) { win.__savedProfile = JSON.parse(options.body); return { ok: true }; }
          throw new Error(`Unexpected route ${route}`);
        },
      };
    } });
    cy.get('#profileService').should('have.value', 'Elétrica').select('Pintura');
    cy.get('#profileNeighborhood').select('Gleba B');
    cy.get('.profile-form').submit();
    cy.window().its('__savedProfile').should('include', { service_category: 'Pintura', neighborhood: 'Gleba B' });
  });

  it('oculta e exclui campos de prestador ao editar um perfil cliente', () => {
    cy.visit('/src/pages/Meuperfil.html', { onBeforeLoad(win) {
      const session = { user: { id: 'client-1', email: 'cliente@example.com' }, access_token: 'test-token' };
      win.__nexlarApi = {
        supabase: { auth: { signOut: async () => ({ error: null }) } },
        requireSession: async () => session,
        request: async (route, options) => {
          if (route === 'me' && !options) return { id: 'client-1', role: 'cliente', full_name: 'Cliente', phone: '', bio: '', avatar_url: null };
          if (route === 'me' && options) { win.__savedProfile = JSON.parse(options.body); return { ok: true }; }
          throw new Error(`Unexpected route ${route}`);
        },
      };
    } });
    cy.get('#profileNeighborhood').should('be.disabled').closest('.form-group').should('not.be.visible');
    cy.get('#profileService').should('be.disabled').closest('.form-group').should('not.be.visible');
    cy.get('#profileName').should('have.value', 'Cliente');
    cy.get('.btn-save').click();
    cy.window().should(win => {
      expect(win.__savedProfile).not.to.have.property('neighborhood');
      expect(win.__savedProfile).not.to.have.property('service_category');
    });
  });
});

describe('Avatares no chat', () => {
  it('mostra a foto no contato e no cabeçalho sem sobrepor as iniciais', () => {
    cy.intercept('GET', '/src/js/api.js', { body: 'window.nexlarReady=Promise.resolve(window.__nexlarApi)' });
    cy.intercept('GET', '/avatar-chat.svg', {
      statusCode: 200, headers: { 'content-type': 'image/svg+xml' },
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="20" fill="green"/></svg>',
    });
    cy.visit('/src/pages/painelmensagens.html', { onBeforeLoad(win) {
      const session = { user: { id: 'client-1', email: 'client@example.com' }, access_token: 'test-token' };
      const provider = { id: 'provider-1', full_name: 'Davi Teles', avatar_url: '/avatar-chat.svg' };
      const conversation = { id: 'conversation-1', client_id: 'client-1', provider_id: 'provider-1', client: { id: 'client-1', full_name: 'Cliente' }, provider, updated_at: '2026-11-02T12:00:00Z' };
      const channel = { on() { return this; }, subscribe(callback) { callback('SUBSCRIBED'); return this; } };
      win.__nexlarApi = {
        supabase: { auth: { signOut: async () => ({ error: null }) }, channel: () => channel, removeChannel: async () => {} },
        requireSession: async () => session,
        request: async route => {
          if (route === 'me') return { id: 'client-1', role: 'cliente', full_name: 'Cliente' };
          if (route === 'conversations') return [conversation];
          if (route.startsWith('messages&') || route.startsWith('contracts&')) return [];
          throw new Error(`Unexpected route ${route}`);
        },
      };
    } });
    cy.get('.conversation-item .avatar').should('have.class', 'has-photo')
      .find('.avatar-fallback').should('have.css', 'visibility', 'hidden');
    cy.get('.conversation-item').click();
    cy.get('#chatHeaderAvatar').should('have.class', 'has-photo')
      .find('.avatar-fallback').should('have.css', 'visibility', 'hidden');
  });
});
