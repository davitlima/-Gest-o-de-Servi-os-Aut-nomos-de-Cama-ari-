describe('Testes de Fluxo de Navegação Completa - Nexlar', () => {

  // Definição da URL base local (ajuste a porta 5500 se o seu Live Server usar outra)
  const baseUrl = 'http://127.0.0.1:5500/src/pages'

  it('Deve navegar com sucesso por todas as páginas do sistema', () => {
    
    // ----------------------------------------------------
    // 1. TESTANDO A PÁGINA INICIAL (inicio.html)
    // ----------------------------------------------------
    cy.visit(`${baseUrl}/inicio.html`)
    cy.title().should('include', 'Nexlar - Início')
    
    // Testando o botão do Painel Financeiro no topo da Navbar
    cy.get('.nav-actions').contains('Painel').click()
    cy.url().should('include', 'Painelfinanceiro.html')

    // Voltando para o início para continuar o fluxo
    cy.visit(`${baseUrl}/inicio.html`)

    // Testando o botão Meu Perfil no topo da Navbar 
    
    cy.get('.nav-actions').contains('Meu Perfil').click()
    cy.url().should('include', 'Meuperfil.html')

    // 2. TESTANDO A BARRA LATERAL (SIDEBAR) A PARTIR DO PERFIL
   

    // Clicando no link "Financeiro" da barra lateral
    cy.get('.sidebar nav').contains('Financeiro').click()
    cy.url().should('include', 'Painelfinanceiro.html')

    // Clicando no link "Mensagem" da barra lateral
    cy.get('.sidebar nav').contains('Mensagem').click()
    cy.url().should('include', 'painelmensagens.html')

    // Clicando no link "Início" da barra lateral para voltar ao começo
    cy.get('.sidebar nav').contains('Início').click()
    cy.url().should('include', 'inicio.html')

    // 3. TESTANDO ACESSO AO PERFIL AUTÔNOMO VIA CARDS

    // Clica no primeiro card de profissional disponível (Marcos Silva)
    // Usamos o .first() para pegar o primeiro da lista de seletores .card
    cy.get('.cards .card').first().click()
    cy.url().should('include', 'perfilAutonomo.html')
  })

})