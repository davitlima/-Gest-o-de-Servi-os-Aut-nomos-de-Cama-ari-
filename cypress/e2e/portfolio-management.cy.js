function visitProviderProfile({ items = [], failPortfolioInsert = false } = {}) {
  cy.intercept('GET', '/src/js/api.js', { body: 'window.nexlarReady=Promise.resolve(window.__nexlarApi)' });
  cy.visit('/src/pages/Meuperfil.html', { onBeforeLoad(win) {
    win.__portfolioItems = [...items];
    win.__portfolioRequests = [];
    win.__storagePaths = [];
    win.__removedStoragePaths = [];
    win.__nexlarApi = {
      requireSession: async () => ({ user: { id: 'provider-1', email: 'ana@example.com' } }),
      supabase: {
        auth: { signOut: async () => ({ error: null }) },
        storage: { from: () => ({
          upload: async path => { win.__storagePaths.push(path); return { error: null }; },
          getPublicUrl: path => ({ data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/avatars/${path}` } }),
          remove: async paths => { win.__removedStoragePaths.push(...paths); win.__storagePaths = win.__storagePaths.filter(path => !paths.includes(path)); return { error: null }; },
        }) },
      },
      request: async (route, options) => {
        if (route === 'me' && !options) return { id: 'provider-1', role: 'autonomo', full_name: 'Ana Prestadora', phone: '', neighborhood: 'Gleba A', service_category: 'Elétrica', bio: '', avatar_url: null };
        if (route === 'portfolio' && !options) return win.__portfolioItems;
        if (route === 'portfolio' && options?.method === 'POST') {
          const item = JSON.parse(options.body);
          win.__portfolioRequests.push(item);
          if (failPortfolioInsert) throw new Error('Falha de banco simulada.');
          win.__portfolioItems.push({ id: 2, ...item, portfolio_item_images: item.images });
          return { id: 2, ...item };
        }
        if (route.startsWith('portfolio/') && options?.method === 'PATCH') {
          const item = JSON.parse(options.body);
          win.__portfolioRequests.push(item);
          win.__portfolioItems = win.__portfolioItems.map(existing => String(existing.id) === route.slice('portfolio/'.length) ? { ...existing, ...item, portfolio_item_images: item.images } : existing);
          return win.__portfolioItems.find(existing => String(existing.id) === route.slice('portfolio/'.length));
        }
        if (route.startsWith('portfolio/') && options?.method === 'DELETE') {
          win.__portfolioItems = win.__portfolioItems.filter(item => String(item.id) !== route.slice('portfolio/'.length));
          return {};
        }
        throw new Error(`Rota inesperada: ${route}`);
      },
    };
    Object.defineProperty(win, 'supabase', { configurable: false, get: () => ({ createClient: () => win.__nexlarApi.supabase }), set: () => {} });
  } });
}

describe('Gerenciamento do portfólio profissional', () => {
  it('mantém o portfólio em um painel próprio, sem dados pessoais', () => {
    visitProviderProfile();
    [1280, 390].forEach(width => {
      cy.viewport(width, 844);
      cy.get('#profileTab').click();
      cy.get('#profile-personal-panel').should('be.visible');
      cy.get('#portfolioTab').click();
      cy.get('#profile-personal-panel').should('not.be.visible');
      cy.get('#portfolio-content').should('be.visible');
      cy.get('#portfolio-content').parent().should('not.have.class', 'profile-card');
      cy.get('#portfolio-content').should('not.contain', 'Nome Completo');
    });
  });

  it('envia várias imagens na ordem selecionada ao criar uma oferta', () => {
    visitProviderProfile();
    cy.get('#portfolioTab').click();
    cy.contains('button', '+ Criar oferta').click();
    cy.get('#portfolioFileInput').should('have.attr', 'multiple');
    cy.get('#portfolioFileInput').selectFile([
      'src/images/Logo.png', 'src/images/image-removebg-preview.png',
    ], { force: true });
    cy.get('#portfolioUploadPreview img').should('have.length', 2);
    cy.get('#portfolioTitle').type('Pintura de quarto');
    cy.get('#portfolioPriceMode').select('sob_consulta');
    cy.get('#savePortfolioUpload').click();
    cy.window().its('__portfolioRequests.0.images').should(images => {
      expect(images).to.have.length(2);
      expect(images[0].storage_path).to.contain('logo.png');
      expect(images[1].storage_path).to.contain('image-removebg-preview.png');
      expect(images.every(image => image.storage_path.startsWith('provider-1/portfolio/'))).to.equal(true);
    });
  });

  it('seleciona a imagem, mostra prévia, salva caminho e descrição', () => {
    visitProviderProfile();
    cy.get('#portfolioTab').click();
    cy.get('.profile-photo').should('not.be.visible');
    cy.get('.profile-form').should('not.be.visible');
    cy.get('.profile-card > h3').should('not.be.visible');
    cy.contains('button', '+ Criar oferta').click();
    cy.get('#portfolioFileInput').selectFile('src/images/Logo.png', { force: true });
    cy.get('#portfolioUploadPreview img').should('be.visible');
    cy.get('#portfolioDescription').type('Instalação residencial');
    cy.get('#portfolioTitle').type('Pintura de quarto');
    cy.get('#portfolioPriceMode').select('a_partir_de');
    cy.get('#portfolioPrice').type('350');
    cy.get('#portfolioDuration').type('2 dias');
    cy.get('#savePortfolioUpload').click();
    cy.window().its('__portfolioRequests.0').should(item => {
      expect(item.description).to.equal('Instalação residencial');
      expect(item.title).to.equal('Pintura de quarto');
      expect(item.price_mode).to.equal('a_partir_de');
      expect(item.price).to.equal(350);
      expect(item.estimated_duration).to.equal('2 dias');
      expect(item.images).to.have.length(1);
      expect(item.images[0].storage_path).to.match(/^provider-1\/portfolio\//);
      expect(item.images[0].image_url).to.include(`/avatars/${item.images[0].storage_path}`);
    });
    cy.window().its('__portfolioItems').should('have.length', 1);
    cy.get('#portfolio-content').scrollIntoView();
    cy.contains('#portfolio-content', 'Instalação residencial').should('be.visible');
    cy.contains('#portfolio-content', 'A partir de R$ 350,00').should('be.visible');
    cy.contains('#portfolio-content', 'Prazo estimado: 2 dias').should('be.visible');
  });

  it('aceita arrastar a imagem e rejeita tipo e tamanho inválidos', () => {
    visitProviderProfile();
    cy.get('#portfolioTab').click();
    cy.contains('button', '+ Criar oferta').click();
    cy.get('#portfolioDropzone').selectFile('src/images/Logo.png', { action: 'drag-drop' });
    cy.get('#portfolioUploadPreview img').should('be.visible');
    cy.get('#portfolioUploadModal').should('have.attr', 'aria-modal', 'true');
    cy.get('body').type('{esc}');
    cy.get('#addPortfolioOffer').should('have.focus');
    cy.get('#portfolioTab').click();
    cy.contains('button', '+ Criar oferta').click();
    cy.get('#portfolioFileInput').selectFile({
      contents: Cypress.Buffer.from('not an image'), fileName: 'arquivo.svg', mimeType: 'image/svg+xml',
    }, { force: true });
    cy.get('#portfolioUploadMessage').should('contain', 'JPG, PNG, GIF ou WebP');
    cy.get('#savePortfolioUpload').should('be.disabled');
    cy.get('#portfolioFileInput').selectFile({
      contents: Cypress.Buffer.alloc(5 * 1024 * 1024 + 1), fileName: 'grande.png', mimeType: 'image/png',
    }, { force: true });
    cy.get('#portfolioUploadMessage').should('contain', 'no máximo 5 MB');
  });

  it('remove o arquivo recém-enviado se a gravação no banco falhar', () => {
    visitProviderProfile({ failPortfolioInsert: true });
    cy.get('#portfolioTab').click();
    cy.contains('button', '+ Criar oferta').click();
    cy.get('#portfolioFileInput').selectFile('src/images/Logo.png', { force: true });
    cy.get('#portfolioTitle').type('Instalação elétrica');
    cy.get('#portfolioPriceMode').select('sob_consulta');
    cy.get('#savePortfolioUpload').click();
    cy.contains('#portfolioUploadMessage', 'Falha de banco simulada.').should('be.visible');
    cy.window().its('__storagePaths').should('be.empty');
    cy.window().its('__removedStoragePaths.0').should('match', /^provider-1\/portfolio\//);
  });

  it('remove a imagem do Storage ao excluir um trabalho', () => {
    visitProviderProfile({ items: [{
      id: 1, image_url: 'https://example.supabase.co/storage/v1/object/public/avatars/provider-1/portfolio/1-trabalho.png',
      storage_path: 'provider-1/portfolio/1-trabalho.png', description: 'Trabalho antigo',
    }] });
    cy.on('window:confirm', () => true);
    cy.get('#portfolioTab').click();
    cy.get('#portfolio-content').scrollIntoView();
    cy.contains('#portfolio-content', 'Trabalho antigo').should('be.visible');
    cy.get('#portfolio-content .portfolio-remove').click();
    cy.contains('#portfolio-content', 'Trabalho antigo').should('not.exist');
    cy.window().its('__removedStoragePaths').should('include', 'provider-1/portfolio/1-trabalho.png');
  });

  it('edita título, preço e prazo de um item existente sem reenviar imagem', () => {
    visitProviderProfile({ items: [{
      id: 8, image_url: '/trabalho.png', storage_path: null, title: 'Reparo antigo', description: 'Descrição',
      price_mode: 'sob_consulta', price: null, estimated_duration: 'A combinar',
    }] });
    cy.get('#portfolioTab').click();
    cy.contains('button', 'Editar').click();
    cy.get('#portfolioTitle').clear().type('Reparo hidráulico');
    cy.get('#portfolioPriceMode').select('fixo');
    cy.get('#portfolioPrice').should('be.visible').type('180');
    cy.get('#portfolioDuration').clear().type('1 dia');
    cy.contains('button', 'Salvar alterações').click();
    cy.window().its('__portfolioRequests.0').should(item => {
      expect(item.title).to.equal('Reparo hidráulico');
      expect(item.price_mode).to.equal('fixo');
      expect(item.price).to.equal(180);
      expect(item.estimated_duration).to.equal('1 dia');
      expect(item.images).to.have.length(1);
      expect(item.images[0].image_url).to.equal('/trabalho.png');
    });
    cy.contains('#portfolio-content', 'Reparo hidráulico').should('be.visible');
  });
});
