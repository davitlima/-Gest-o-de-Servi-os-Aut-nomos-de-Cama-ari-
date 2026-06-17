describe('Testes do Perfil do Profissional - Nexlar', () => {

 
  const urlPagina = 'http://127.0.0.1:5500/src/pages/perfilAutonomo.html'

  beforeEach(() => {
 
    cy.visit(urlPagina)
  })

  it('Deve validar as informações do profissional e os blocos da página', () => {
   
    cy.title().should('include', 'Nexlar - Perfil do Profissional')

    
    cy.get('.hero-card__name').should('contain', 'Marcos Silva')
    cy.get('.hero-card__tag').should('contain', '@construção')
    cy.get('.hero-card__rating').should('contain', '4.8')
    cy.get('.hero-card__reviews').should('contain', '127 avaliações')
    cy.get('.hero-card__location').should('contain', 'Centro, Camaçari - BA')

    cy.get('#sobre').within(() => {
      cy.get('.about-text').should('contain', 'Mais de 15 anos de experiência.')
      cy.get('.stats-grid').should('contain', '15+ anos')
      cy.get('.stats-grid').should('contain', '200+')
    })

  
    cy.get('#portfolio .portfolio-grid').children().should('have.length', 6)
  })

  it('Deve interagir com o sistema de avaliação por estrelas na barra lateral', () => {
   
    cy.get('#starHint').should('contain', 'Clique nas estrelas para avaliar')

  
    cy.get('#starRating .star-btn').eq(3).click()

  })

  it('Deve testar a navegação e links de redirecionamento', () => {
   
    cy.get('.hero-card').contains('Enviar Mensagem').should('have.attr', 'href', 'painelmensagens.html')

    cy.get('.navbar__logo a').should('have.attr', 'href', 'inicio.html')

  r
    cy.get('.navbar__links').contains('Voltar').should('be.visible')
  })
})