describe('Tela de Cadastro de Empresa - Nexlar', () => {
  
  beforeEach(() => {
    // Abre o arquivo HTML local diretamente sem precisar de servidor
    cy.visit('http://127.0.0.1:5501/src/pages/cadastroempresa.html'); 
  });

  it('Deve carregar os elementos principais da tela com sucesso', () => {
    // Valida o título da aba
    cy.title().should('contain', 'Nexlar - Cadastro');

    // Valida os textos principais do card
    cy.get('.card h3').should('contain', 'Bem-vindos ao Nexlar!');
    cy.get('.card h2').should('contain', 'Cadastro da Empresa');
    
    // Verifica se a logo está visível
    cy.get('.logo-img').should('be.visible');
  });

  it('Deve preencher o formulário e enviar com sucesso', () => {
    // Preenche o nome da empresa pelo placeholder
    cy.get('input[placeholder="Nome da Empresa"]')
      .type('Empresa de Teste LTDA')
      .should('have.value', 'Empresa de Teste LTDA');

    // Preenche o CNPJ
    cy.get('input[placeholder="CNPJ"]')
      .type('12.345.678/0001-99')
      .should('have.value', '12.345.678/0001-99');

    // Preenche o contato/telefone
    cy.get('input[type="tel"]')
      .type('(11) 99999-9999')
      .should('have.value', '(11) 99999-9999');

    // Preenche a senha
    cy.get('input[type="password"]')
      .type('SenhaSegura123')
      .should('have.value', 'SenhaSegura123');

    // Marca o checkbox dos termos de uso
    cy.get('#terms')
      .check()
      .should('be.checked');

    // Clica no botão de continuar
    cy.get('.btn-continue').click();
  });

  it('Deve impedir o envio se os campos obrigatórios estiverem vazios', () => {
    // Tenta clicar direto no botão de continuar sem preencher nada
    cy.get('.btn-continue').click();

    // Verifica se o formulário barrou o envio usando a validação nativa do HTML
    cy.get('input[placeholder="Nome da Empresa"]').then(($input) => {
      expect($input[0].validationMessage).to.not.be.empty;
    });
  });

  it('Deve exigir a marcação dos Termos de Uso', () => {
    // Preenche os campos mas deixa o checkbox desmarcado
    cy.get('input[placeholder="Nome da Empresa"]').type('Empresa Teste');
    cy.get('input[placeholder="CNPJ"]').type('12345678000199');
    cy.get('input[type="tel"]').type('11999999999');
    cy.get('input[type="password"]').type('123456');

    // Tenta enviar
    cy.get('.btn-continue').click();

    // Valida que o checkbox disparou o aviso de obrigatoriedade do navegador
    cy.get('#terms').then(($checkbox) => {
      expect($checkbox[0].validationMessage).to.not.be.empty;
    });
  });
});