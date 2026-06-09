describe('Cadastro do Cliente - Nexlar', () => {

  beforeEach(() => {
    cy.visit('src/pages/cadastrocliente.html');
  });

  it('Deve exibir os elementos da página corretamente', () => {
    cy.contains('Cadastro do Cliente').should('be.visible');

    cy.get('#nome').should('be.visible');
    cy.get('#nascimento').should('be.visible');
    cy.get('#cpf').should('be.visible');
    cy.get('#contato').should('be.visible');
    cy.get('#senha').should('be.visible');
    cy.get('#termos').should('exist');

    cy.get('#btnContinuar')
      .should('contain.text', 'Continuar');
  });

  it('Deve aplicar máscara de data', () => {
    cy.get('#nascimento')
      .type('01012000')
      .should('have.value', '01/01/2000');
  });

  it('Deve aplicar máscara de CPF', () => {
    cy.get('#cpf')
      .type('12345678909')
      .should('have.value', '123.456.789-09');
  });

  it('Deve aplicar máscara de telefone', () => {
    cy.get('#contato')
      .type('71999998888')
      .should('have.value', '(71) 99999-8888');
  });

  it('Não deve permitir cadastro sem preencher os campos', () => {
    cy.get('form').submit();

    cy.get('#nome:invalid')
      .should('exist');
  });

  it('Deve exibir erro para CPF inválido', () => {

    cy.get('#nome').type('Maria Silva');
    cy.get('#nascimento').type('01012000');
    cy.get('#cpf').type('11111111111');
    cy.get('#contato').type('71999998888');
    cy.get('#senha').type('123456');
    cy.get('#termos').check();

    cy.get('form').submit();

    cy.get('#toast')
      .should('contain.text', 'CPF inválido');
  });

  it('Deve exibir erro para data inválida', () => {

    cy.get('#nome').type('Maria Silva');
    cy.get('#nascimento').type('32132000');
    cy.get('#cpf').type('52998224725');
    cy.get('#contato').type('71999998888');
    cy.get('#senha').type('123456');
    cy.get('#termos').check();

    cy.get('form').submit();

    cy.get('#toast')
      .should('contain.text', 'Data de nascimento inválida');
  });

  it('Deve exibir erro quando a senha tiver menos de 6 caracteres', () => {

    cy.get('#nome').type('Maria Silva');
    cy.get('#nascimento').type('01012000');
    cy.get('#cpf').type('52998224725');
    cy.get('#contato').type('71999998888');
    cy.get('#senha').type('123');
    cy.get('#termos').check();

    cy.get('form').submit();

    cy.get('#toast')
      .should('contain.text', 'A senha deve ter pelo menos 6 caracteres');
  });

  it('Deve exibir erro quando os termos não forem aceitos', () => {

    cy.get('#nome').type('Maria Silva');
    cy.get('#nascimento').type('01012000');
    cy.get('#cpf').type('52998224725');
    cy.get('#contato').type('71999998888');
    cy.get('#senha').type('123456');

    cy.get('form').submit();

    cy.get('#termos:invalid')
      .should('exist');
  });

  it('Deve realizar cadastro com sucesso', () => {

    cy.get('#nome').type('Maria Silva');
    cy.get('#nascimento').type('01012000');
    cy.get('#cpf').type('52998224725');
    cy.get('#contato').type('71999998888');
    cy.get('#senha').type('123456');
    cy.get('#termos').check();

    cy.get('form').submit();

    cy.get('#btnContinuar')
      .should('contain.text', 'Processando');

    cy.wait(2000);

    cy.get('#toast')
      .should('contain.text', 'Cadastro realizado com sucesso');
  });

  it('Deve exibir mensagem de ajuda', () => {

    cy.get('.btn-help').click();

    cy.get('#toast')
      .should(
        'contain.text',
        'Preencha todos os campos para criar sua conta Nexlar'
      );
  });

});