describe('Testes do Painel Financeiro - Nexlar', () => {

  // Definição da URL base local conforme sua rota oficial
  const baseUrl = 'http://127.0.0.1:5500/src/pages'

  it('Deve interagir com o painel financeiro, adicionar um registro e validar os dados', () => {
    
    // ----------------------------------------------------
    // 1. TESTANDO O ESTADO INICIAL DA TELA
    // ----------------------------------------------------
    cy.visit(`${baseUrl}/Painelfinanceiro.html`)
    
    // Pausa de meio segundo para o JS carregar a tela completamente
    cy.wait(500)
    
    // Validando apenas os números para evitar problemas com espaços do símbolo R$
    cy.get('#ganhoMes').should('contain', '0,00')
    cy.get('#mediaMensal').should('contain', '0,00')
    cy.get('#progressPct').should('contain', '0%')
    
    // Verifica se a mensagem de histórico vazio está visível antes do cadastro
    cy.get('#historyList').should('contain', 'Nenhum registro ainda. Clique em "Adicionar Registro".')

    // ----------------------------------------------------
    // 2. TESTANDO ABERTURA E CANCELAMENTO DO MODAL
    // ----------------------------------------------------
    // Abre o modal e fecha pelo botão Cancelar
    cy.get('#openModal').click()
    cy.get('#modalOverlay').should('be.visible')
    cy.get('#cancelModal').click()
    cy.get('#modalOverlay').should('not.be.visible')

    // Abre novamente para fazer o cadastro real
    cy.get('#openModal').click()

    // ----------------------------------------------------
    // 3. PREENCHENDO O FORMULÁRIO DE REGISTRO
    // ----------------------------------------------------
    cy.get('#fNome').type('Instalação Elétrica - Camaçari Centro')
    cy.get('#fCategoria').select('Instalação Elétrica')
    cy.get('#fMes').select('Junho')
    cy.get('#fValor').type('1500.00')
    cy.get('#fData').type('2026-06-02') // Formato correto para inputs do tipo date
    cy.get('#fCliente').type('Gleba A')
    cy.get('#fStatus').select('Concluído')
    cy.get('#fObs').type('Serviço de teste automatizado executado com sucesso.')

    // Clica para salvar o registro
    cy.get('#saveModal').click()

 // ----------------------------------------------------
    // 4. VALIDAÇÕES APÓS SALVAR O SERVIÇO
    // ----------------------------------------------------
    // O modal deve sumir da tela
    cy.get('#modalOverlay').should('not.be.visible')

    // Damos 500ms para o seu script processar e atualizar a tabela/cards
    cy.wait(500)

    // O texto de estado vazio deve sumir e o novo serviço deve aparecer no histórico
    cy.get('#historyList').should('not.contain', 'Nenhum registro ainda')
    cy.get('#historyList').should('contain', 'Instalação Elétrica - Camaçari Centro')
    
    // Verifica se o valor correto do ganho atualizou no card principal
    cy.get('#ganhoMes').should('contain', '1.500,00')
  })

})