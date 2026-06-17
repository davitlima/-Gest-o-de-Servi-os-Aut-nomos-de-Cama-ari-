describe('Testes de Fluxo de Navegação Completa - Nexlar', () => {

  const baseUrl = 'http://127.0.0.1:5500/src/pages'

  it('Deve navegar com sucesso por todas as páginas do sistema', () => {
    
  
    
    cy.visit(`${baseUrl}/inicio.html`)
    cy.title().should('include', 'Nexlar - Início')
    

    cy.get('.nav-actions').contains('Painel').click()
    cy.url().should('include', 'Painelfinanceiro.html')

    cy.visit(`${baseUrl}/inicio.html`)

    
    cy.get('.nav-actions').contains('Meu Perfil').click()
    cy.url().should('include', 'Meuperfil.html')

   

    cy.get('.sidebar nav').contains('Financeiro').click()
    cy.url().should('include', 'Painelfinanceiro.html')


    cy.get('.sidebar nav').contains('Mensagem').click()
    cy.url().should('include', 'painelmensagens.html')

   
    cy.get('.sidebar nav').contains('Início').click()
    cy.url().should('include', 'inicio.html')


    cy.get('.cards .card').first().click()
    cy.url().should('include', 'perfilAutonomo.html')
  })

})