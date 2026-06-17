describe('Tela de Cadastro de Empresa - Nexlar', () => {
  
  beforeEach(() => {

    cy.visit('http://127.0.0.1:5501/src/pages/cadastroempresa.html'); 
  });

  it('Deve carregar os elementos principais da tela com sucesso', () => {

    cy.title().should('contain', 'Nexlar - Cadastro');

    cy.get('.card h3').should('contain', 'Bem-vindos ao Nexlar!');
    cy.get('.card h2').should('contain', 'Cadastro da Empresa');
  
    cy.get('.logo-img').should('be.visible');
  });

  it('Deve preencher o formulário e enviar com sucesso', () => {

    cy.get('input[placeholder="Nome da Empresa"]')
      .type('Empresa de Teste LTDA')
      .should('have.value', 'Empresa de Teste LTDA');

    cy.get('input[placeholder="CNPJ"]')
      .type('12.345.678/0001-99')
      .should('have.value', '12.345.678/0001-99');

 
    cy.get('input[type="tel"]')
      .type('(11) 99999-9999')
      .should('have.value', '(11) 99999-9999');

    cy.get('input[type="password"]')
      .type('SenhaSegura123')
      .should('have.value', 'SenhaSegura123');

    cy.get('#terms')
      .check()
      .should('be.checked');


    cy.get('.btn-continue').click();
  });

  it('Deve impedir o envio se os campos obrigatórios estiverem vazios', () => {

    cy.get('.btn-continue').click();

 
    cy.get('input[placeholder="Nome da Empresa"]').then(($input) => {
      expect($input[0].validationMessage).to.not.be.empty;
    });
  });

  it('Deve exigir a marcação dos Termos de Uso', () => {

    cy.get('input[placeholder="Nome da Empresa"]').type('Empresa Teste');
    cy.get('input[placeholder="CNPJ"]').type('12345678000199');
    cy.get('input[type="tel"]').type('11999999999');
    cy.get('input[type="password"]').type('123456');

    cy.get('.btn-continue').click();

   
    cy.get('#terms').then(($checkbox) => {
      expect($checkbox[0].validationMessage).to.not.be.empty;
    });
  });
});