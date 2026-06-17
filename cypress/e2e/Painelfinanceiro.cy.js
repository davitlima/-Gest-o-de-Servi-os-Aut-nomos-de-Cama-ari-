describe('Testes do Painel Financeiro - Nexlar', () => {

  const baseUrl = 'http://127.0.0.1:5500/src/pages'

  it('Deve interagir com o painel financeiro, adicionar um registro e validar os dados', () => {
    
  
    cy.visit(`${baseUrl}/Painelfinanceiro.html`)
    
    cy.wait(500)
    
    cy.get('#ganhoMes').should('contain', '0,00')
    cy.get('#mediaMensal').should('contain', '0,00')
    cy.get('#progressPct').should('contain', '0%')
  
    cy.get('#historyList').should('contain', 'Nenhum registro ainda. Clique em "Adicionar Registro".')

    // Abre o modal e fecha pelo botão Cancelar
    cy.get('#openModal').click()
    cy.get('#modalOverlay').should('be.visible')
    cy.get('#cancelModal').click()
    cy.get('#modalOverlay').should('not.be.visible')

    cy.get('#openModal').click()

    cy.get('#fNome').type('Instalação Elétrica - Camaçari Centro')
    cy.get('#fCategoria').select('Instalação Elétrica')
    cy.get('#fMes').select('Junho')
    cy.get('#fValor').type('1500.00')
    cy.get('#fData').type('2026-06-02') // Formato correto para inputs do tipo date
    cy.get('#fCliente').type('Gleba A')
    cy.get('#fStatus').select('Concluído')
    cy.get('#fObs').type('Serviço de teste automatizado executado com sucesso.')

   
    cy.get('#saveModal').click()

    cy.get('#modalOverlay').should('not.be.visible')

    cy.wait(500)

    cy.get('#historyList').should('not.contain', 'Nenhum registro ainda')
    cy.get('#historyList').should('contain', 'Instalação Elétrica - Camaçari Centro')
    
    
    cy.get('#ganhoMes').should('contain', '1.500,00')
  })

})