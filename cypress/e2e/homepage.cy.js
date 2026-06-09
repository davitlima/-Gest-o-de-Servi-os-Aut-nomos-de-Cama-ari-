describe('Homepage Nexlar', () => {

  beforeEach(() => {
    cy.visit('/');
  });

  it('deve exibir o header', () => {
    cy.get('header').should('be.visible');
  });

  it('deve exibir os links de cadastro', () => {
    cy.contains('Para Autônomo').should('be.visible');
    cy.contains('Para Empresa').should('be.visible');
    cy.contains('Entrar').should('be.visible');
  });

  it('deve exibir os botões principais', () => {
    cy.contains('Encontrar Profissional').should('be.visible');
    cy.contains('Sou Profissional').should('be.visible');
  });

  it('deve exibir categorias de serviços', () => {
    cy.get('.cat').should('have.length.at.least', 4);
  });

  it('deve exibir profissionais cadastrados', () => {
    cy.get('.card').should('have.length.at.least', 1);
  });

  it('deve exibir botão ver profissionais', () => {
    cy.get('.btn-profissionais')
      .should('be.visible');
  });

  it('deve exibir botão enviar mensagem nos cards', () => {
    cy.get('.btn-msg')
      .first()
      .should('be.visible');
  });

});