describe('Testes do Perfil do Profissional - Nexlar', () => {

  // URL base local apontando para a página do perfil autônomo
  const urlPagina = 'http://127.0.0.1:5500/src/pages/perfilAutonomo.html'

  beforeEach(() => {
    // Visita a página do perfil antes de cada teste
    cy.visit(urlPagina)
  })

  it('Deve validar as informações do profissional e os blocos da página', () => {
    // 1. Garante que o título correto da página carregou
    cy.title().should('include', 'Nexlar - Perfil do Profissional')

    // 2. Valida os dados principais do cabeçalho (Hero Card)
    cy.get('.hero-card__name').should('contain', 'Marcos Silva')
    cy.get('.hero-card__tag').should('contain', '@construção')
    cy.get('.hero-card__rating').should('contain', '4.8')
    cy.get('.hero-card__reviews').should('contain', '127 avaliações')
    cy.get('.hero-card__location').should('contain', 'Centro, Camaçari - BA')

    // 3. Valida os dados da seção "Sobre"
    cy.get('#sobre').within(() => {
      cy.get('.about-text').should('contain', 'Mais de 15 anos de experiência.')
      cy.get('.stats-grid').should('contain', '15+ anos')
      cy.get('.stats-grid').should('contain', '200+')
    })

    // 4. Garante que existem os itens do portfólio na tela
    cy.get('#portfolio .portfolio-grid').children().should('have.length', 6)
  })

  it('Deve interagir com o sistema de avaliação por estrelas na barra lateral', () => {
    // O texto inicial deve instruir o usuário a clicar nas estrelas
    cy.get('#starHint').should('contain', 'Clique nas estrelas para avaliar')

    // Clica na quarta estrela (data-value="4")
    cy.get('#starRating .star-btn').eq(3).click()

    // Nota: Como o script interno de comportamento muda o texto de orientação (#starHint) 
    // ou adiciona classes ativas, você pode expandir essa validação abaixo se o seu JS mudar o texto:
    // cy.get('#starHint').should('not.contain', 'Clique nas estrelas')
  })

  it('Deve testar a navegação e links de redirecionamento', () => {
    // 1. Verifica se o botão "Enviar Mensagem" leva para o painel de mensagens
    cy.get('.hero-card').contains('Enviar Mensagem').should('have.attr', 'href', 'painelmensagens.html')

    // 2. Verifica se a logo da Navbar possui o link correto para voltar para o início
    cy.get('.navbar__logo a').should('have.attr', 'href', 'inicio.html')

    // 3. Verifica a presença do botão "Voltar" na navbar
    cy.get('.navbar__links').contains('Voltar').should('be.visible')
  })
})