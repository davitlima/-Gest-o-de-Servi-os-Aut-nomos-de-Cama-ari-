document.addEventListener('DOMContentLoaded', () => {

  const starBtns = document.querySelectorAll('.star-btn'); // Botões de estrela (interativos)
  const starHint = document.getElementById('starHint');   // Texto que mostra "Muito ruim", "Bom", etc.
  let currentRating = 0; // Armazena a nota que o usuário clicou

  // Mensagens que aparecem ao passar o mouse ou clicar nas estrelas
  const hintMessages = {
    0: 'Clique nas estrelas para avaliar',
    1: 'Muito ruim',
    2: 'Ruim',
    3: 'Regular',
    4: 'Bom',
    5: 'Excelente!'
  };

  // Função para pintar as estrelas (preenchidas ou vazias)
  function setStars(value, isHover = false) {
    starBtns.forEach((btn, i) => {
      if (i < value) {
        btn.textContent = '★'; // Estrela preenchida
        btn.classList.add('active');
      } else {
        btn.textContent = '☆'; // Estrela vazia
        btn.classList.remove('active');
      }
    });

    // Se estiver apenas passando o mouse, atualiza a legenda temporariamente
    if (isHover) {
      starHint.textContent = hintMessages[value] || '';
    }
  }

  // --- EVENTOS DAS ESTRELAS ---
  starBtns.forEach((btn) => {
    const val = parseInt(btn.dataset.value);

    // Quando o mouse entra na estrela
    btn.addEventListener('mouseenter', () => setStars(val, true));

    // Quando o mouse sai da estrela (volta para a nota que já estava clicada)
    btn.addEventListener('mouseleave', () => {
      setStars(currentRating, false);
      starHint.textContent = currentRating ?
        `Sua avaliação: ${hintMessages[currentRating]}` :
        hintMessages[0];
    });

    // Quando clica na estrela (define a nota oficial)
    btn.addEventListener('click', () => {
      currentRating = val;
      setStars(currentRating, false);
      starHint.textContent = `Sua avaliação: ${hintMessages[currentRating]}`;
      showToast(`Você avaliou com ${currentRating} estrela${currentRating > 1 ? 's' : ''}!`);
    });

    });


  const verTodasBtn = document.getElementById('verTodasBtn');
  
  // Lista de avaliações  que serão carregadas ao clicar no botão
  const extraReviews = [{
      initials: 'RC',
      name: 'Ricardo Costa',
      date: 'Há 3 meses',
      stars: 5,
      text: 'Serviço de altíssima qualidade. O acabamento ficou incrível!',
      color: '#f59e0b'
    },
    {
      initials: 'FM',
      name: 'Fernanda Moura',
      date: 'Há 4 meses',
      stars: 4,
      text: 'Ótimo profissional, comunicação excelente e resultado muito bom.',
      color: '#10b981'
    },
    {
      initials: 'LB',
      name: 'Lucas Batista',
      date: 'Há 5 meses',
      stars: 5,
      text: 'Superou todas as expectativas. Com certeza contrataria novamente!',
      color: '#ef4444'
    }
  ];

  let extraLoaded = false; 

  verTodasBtn.addEventListener('click', () => {
    if (extraLoaded) return;
    extraLoaded = true;

    const container = verTodasBtn.closest('.card'); // Acha o card onde o botão está

    // Cria o HTML para cada nova avaliação da lista acima
    extraReviews.forEach((review) => {
      const el = document.createElement('div');
      el.classList.add('review');
      el.style.animation = 'fadeSlideUp 0.4s ease both'; // Efeito de subida suave

      // Gera as estrelas amarelas e cinzas baseadas na nota
      const starsHtml = '★'.repeat(review.stars) +
        (review.stars < 5 ? `<span style="color:#ddd">${'★'.repeat(5 - review.stars)}</span>` : '');

      el.innerHTML = `
        <div class="review__header">
          <div class="review__avatar" style="background:${review.color}">${review.initials}</div>
          <div class="review__meta">
            <span class="review__name">${review.name}</span>
          </div>
          <span class="review__date">${review.date}</span>
        </div>
        <div class="review__stars">${starsHtml}</div>
        <p class="review__text">${review.text}</p>
      `;

      // Insere a nova avaliação antes do botão "Ver todas"
      container.insertBefore(el, verTodasBtn);
    });

    // Desativa o botão após carregar tudo
    verTodasBtn.textContent = 'Todas as avaliações carregadas';
    verTodasBtn.disabled = true;
    verTodasBtn.style.opacity = '0.5';
    verTodasBtn.style.cursor = 'default';
  });

  // --- BOTÃO DE MENSAGEM (CHAT) ---
  const enviarBtn = document.querySelector('.btn--primary');
  if (enviarBtn) {
    enviarBtn.addEventListener('click', () => {
      showToast('Abrindo chat com Marcos Silva...');
    });
  }

  // --- PORTFÓLIO ---
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  portfolioItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      showToast(`Foto ${i + 1} do portfólio`);
    });
  });

  // --- FUNÇÃO PARA MOSTRAR O TOAST (NOTIFICAÇÃO FLUTUANTE) ---
  function showToast(message) {
    // Remove o toast anterior se ele ainda estiver na tela
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    // Cria o elemento do Toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // Estilização dinâmica via JavaScript
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '28px',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      background: '#1a1d2e',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '999px',
      fontSize: '0.88rem',
      fontFamily: 'DM Sans, sans-serif',
      fontWeight: '600',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      zIndex: '9999',
      opacity: '0',
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap',
    });

    document.body.appendChild(toast);

    // Animação de entrada
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Remove o toast automaticamente após 2.8 segundos
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Faz com que os cards apareçam um por um (efeito cascata)
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.08}s`;
  });

});