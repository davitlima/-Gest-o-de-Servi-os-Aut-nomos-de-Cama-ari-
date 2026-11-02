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
          win.__portfolioItems.push({ id: 2, ...item });
          return { id: 2, ...item };
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
  it('seleciona a imagem, mostra prévia, salva caminho e descrição', () => {
    visitProviderProfile();
    cy.get('#portfolioTab').click();
    cy.contains('button', '+ Adicionar trabalho').click();
    cy.get('#portfolioFileInput').selectFile('src/images/Logo.png', { force: true });
    cy.get('#portfolioUploadPreview img').should('be.visible');
    cy.get('#portfolioDescription').type('Instalação residencial');
    cy.get('#savePortfolioUpload').click();
    cy.window().its('__portfolioRequests.0').should(item => {
      expect(item.description).to.equal('Instalação residencial');
      expect(item.storage_path).to.match(/^provider-1\/portfolio\//);
      expect(item.image_url).to.include(`/avatars/${item.storage_path}`);
    });
    cy.get('#portfolio-content').scrollIntoView();
    cy.contains('#portfolio-content', 'Instalação residencial').should('be.visible');
  });

  it('aceita arrastar a imagem e rejeita tipo e tamanho inválidos', () => {
    visitProviderProfile();
    cy.get('#portfolioTab').click();
    cy.contains('button', '+ Adicionar trabalho').click();
    cy.get('#portfolioDropzone').selectFile('src/images/Logo.png', { action: 'drag-drop' });
    cy.get('#portfolioUploadPreview img').should('be.visible');
    cy.get('#portfolioUploadModal').should('have.attr', 'aria-modal', 'true');
    cy.get('body').type('{esc}');
    cy.get('#portfolioTab').should('have.focus').click();
    cy.contains('button', '+ Adicionar trabalho').click();
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
    cy.contains('button', '+ Adicionar trabalho').click();
    cy.get('#portfolioFileInput').selectFile('src/images/Logo.png', { force: true });
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
});
