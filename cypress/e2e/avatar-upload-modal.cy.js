const fakeSupabase = {
  auth: {
    getSession: async () => ({ data: { session: { user: { id: 'user-1', email: 'teste@nexlar.com' }, access_token: 'token' } } }),
    signOut: async () => ({}),
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '/src/images/Logo.png' } }),
      remove: async () => ({ error: null }),
    }),
  },
};

function visitProfile() {
  cy.intercept('GET', '/api/index.php?route=config', { supabaseUrl: 'https://example.supabase.co', supabaseKey: 'public-key' });
  cy.intercept('GET', '/api/index.php?route=me', {
    id: 'user-1', role: 'cliente', full_name: 'Felipe Souza Nascimento', phone: '', neighborhood: '', bio: '', avatar_url: null,
  });
  cy.visit('/src/pages/Meuperfil.html', {
    onBeforeLoad(win) {
      Object.defineProperty(win, 'supabase', {
        configurable: false,
        get: () => ({ createClient: () => fakeSupabase }),
        set: () => {},
      });
    },
  });
}

describe('Modal de upload de avatar', () => {
  beforeEach(visitProfile);

  it('seleciona por drag-and-drop, mostra prévia e limpa ao reabrir', () => {
    cy.get('.btn-photo').click();
    cy.get('#avatarDropzone').selectFile('src/images/Logo.png', { action: 'drag-drop' });
    cy.get('#avatarUploadPreview img').should('be.visible');
    cy.get('#saveAvatarUpload').should('be.enabled');
    cy.get('body').type('{esc}');
    cy.get('.btn-photo').should('have.focus').click();
    cy.get('#avatarUploadPreview img').should('not.exist');
    cy.get('#saveAvatarUpload').should('be.disabled');
  });

  it('rejeita arquivo fora da lista permitida', () => {
    cy.get('.btn-photo').click();
    cy.get('#avatarFileInput').selectFile({
      contents: Cypress.Buffer.from('<svg></svg>'),
      fileName: 'avatar.svg',
      mimeType: 'image/svg+xml',
    }, { force: true });
    cy.get('#avatarUploadMessage').should('contain', 'JPG, PNG, GIF ou WebP');
    cy.get('#saveAvatarUpload').should('be.disabled');
  });
});
