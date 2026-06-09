describe('Página de Pagamento Nexlar', () => {

  beforeEach(() => {
    cy.visit('/src/pages/pagamento.html');
  });

  it('deve carregar a página de pagamento', () => {
    cy.contains('Finalizar Pagamento').should('be.visible');
  });

  it('deve exibir o resumo do serviço', () => {
    cy.contains('Resumo do Serviço').should('be.visible');
    cy.contains('Marcos Silva').should('be.visible');
    cy.contains('Construção').should('be.visible');
    cy.contains('R$ 1.500,00').should('be.visible');
  });

  it('deve exibir o método PIX selecionado por padrão', () => {
    cy.get('[data-pagamento="pix"]')
      .should('have.class', 'ativo');
  });

  it('deve exibir o código PIX', () => {
    cy.get('#pix')
      .should('be.visible');

    cy.get('#pix input')
      .should('have.value', '00020126360014BR.GOV.BCB.PIX...');
  });

  it('deve exibir o resumo do pedido', () => {
    cy.contains('Resumo do Pedido').should('be.visible');
    cy.contains('Taxa da plataforma (15%)').should('be.visible');
    cy.contains('Total').should('be.visible');
  });

  it('deve exibir o botão confirmar pagamento', () => {
    cy.get('.btn-pagar')
      .should('be.visible')
      .and('contain', 'Confirmar Pagamento');
  });

  it('deve exibir o botão copiar código PIX', () => {
    cy.get('.copiar')
      .should('be.visible');
  });

  it('deve possuir link para cancelar pagamento', () => {
    cy.get('.cancelar')
      .should('have.attr', 'href')
      .and('include', 'painelmensagens');
  });

  it('deve carregar o VLibras', () => {
    cy.get('[vw-access-button]')
      .should('exist');
  });

});