describe('Tela Meu Perfil - Nexlar', () => {

  beforeEach(() => {
    cy.visit('src/pages/Meuperfil.html');
  });

  it('Deve exibir os dados pessoais do usuário', () => {

  cy.get('.container')
    .scrollTo('bottom');

  cy.get('.btn-save')
    .scrollIntoView()
    .should('be.visible');

});
 
  it('Deve alternar para a aba Portfólio', () => {
    cy.contains('.tab', 'Portfólio').click();

    cy.get('#portfolio-content')
      .should('exist')
      .and('be.visible');

    cy.get('.profile-form')
      .should('not.be.visible');
  });

  it('Deve retornar para a aba Informações Pessoais', () => {
    cy.contains('.tab', 'Portfólio').click();
    cy.contains('.tab', 'Informações Pessoais').click();

    cy.get('.profile-form').should('be.visible');
    cy.get('#portfolio-content').should('not.be.visible');
  });

  it('Deve salvar as informações com sucesso', () => {
    cy.clock();

    cy.get('input')
      .first()
      .clear()
      .type('Maria Silva');

    cy.contains('Salvar Anotações').click();

    cy.contains('Salvando...')
      .should('be.visible');

    cy.tick(1200);

    cy.contains('Anotações Salvas com Sucesso! ✓')
      .should('be.visible');
  });

 it('Deve permitir upload de foto de perfil', () => {
  
  cy.get('.btn-photo').click();
  
  cy.get('input[type="file"]')
    .selectFile(
      'cypress/fixtures/perfil.jpg',
      { force: true }
    );
  
  cy.get('.avatar')
    .invoke('attr', 'style')
    .should('contain', 'background-image');
  
  cy.get('div.avatar').click();
 });

  it('Deve realizar logout após confirmação', () => {
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true);
    });

    cy.contains('Sair').click();

    cy.url().should('include', 'index.html');
  });

  it('Deve cancelar logout quando o usuário negar a confirmação', () => {
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(false);
    });

    cy.contains('Sair').click();

    cy.url().should('not.include', 'index.html');
  });

  it('Deve excluir a conta quando a palavra correta for informada', () => {
    cy.window().then((win) => {
      cy.stub(win, 'prompt').returns('DELETAR');
      cy.stub(win, 'alert').as('alerta');
    });

    cy.contains('Excluir Conta').click();

    cy.get('@alerta')
      .should(
        'have.been.calledWith',
        'Sua conta foi removida de nossa base de dados.'
      );
  });

  it('Deve cancelar a exclusão quando a palavra estiver incorreta', () => {
    cy.window().then((win) => {
      cy.stub(win, 'prompt').returns('TESTE');
      cy.stub(win, 'alert').as('alerta');
    });

    cy.contains('Excluir Conta').click();

    cy.get('@alerta')
      .should(
        'have.been.calledWith',
        'Palavra incorreta. A exclusão foi cancelada.'
      );
  });

});