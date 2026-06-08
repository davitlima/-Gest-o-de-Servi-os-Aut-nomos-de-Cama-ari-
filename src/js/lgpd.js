document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Efeito Scroll Reveal (suavizar entrada dos cards)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // 2. Ação do botão "Voltar" da Nav superior (retornar no histórico)
  const btnBack = document.getElementById("btn-back");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      window.history.back();
    });
  }

  // 3. Ação do botão inferior "Voltar para o Início"
  // Apenas rola a tela para o topo suavemente por enquanto
  const btnHome = document.getElementById("btn-home");
  if (btnHome) {
    btnHome.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
});