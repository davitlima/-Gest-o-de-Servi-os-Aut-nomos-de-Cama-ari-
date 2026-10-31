document.addEventListener('DOMContentLoaded', async () => {
  const api = await window.nexlarReady;
  const providerId = new URLSearchParams(location.search).get('id');
  const hint = document.getElementById('starHint');
  if (!providerId) { hint.textContent = 'Abra um profissional pela lista para ver o perfil real.'; return; }

  try {
    const profile = await api.request(`public/profile&id=${encodeURIComponent(providerId)}`);
    const reviews = profile.reviews || [];
    const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
    document.querySelector('.hero-card__name').textContent = profile.company_name || profile.full_name;
    document.querySelector('.hero-card__tag').textContent = profile.service_category ? `@${profile.service_category}` : '@profissional';
    document.querySelector('.hero-card__rating').textContent = average.toFixed(1);
    document.querySelector('.hero-card__reviews').textContent = `${reviews.length} avaliações`;
    document.querySelector('.hero-card__location').lastChild.textContent = ` ${profile.neighborhood || 'Camaçari - BA'}`;
    document.querySelector('.about-text').textContent = profile.bio || 'Profissional cadastrado na Nexlar.';
    document.querySelector('.hero-card .avatar').textContent = (profile.company_name || profile.full_name).split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    const messageLink = document.querySelector('.hero-card .btn--primary'); messageLink.href = window.NexlarChat.professionalChatUrl(providerId);

    const portfolio = document.querySelector('.portfolio-grid'); portfolio.innerHTML = '';
    (profile.portfolio_items || []).forEach(item => {
      const image = document.createElement('img'); image.src = item.image_url; image.alt = item.description || 'Trabalho do profissional'; image.className = 'portfolio-item'; image.style.objectFit = 'cover';
      portfolio.appendChild(image);
    });
    if (!portfolio.children.length) portfolio.textContent = 'O profissional ainda não adicionou trabalhos.';

    const reviewCard = document.getElementById('avaliacoes');
    reviewCard.querySelector('.section-title').textContent = `Avaliações (${reviews.length})`;
    reviewCard.querySelectorAll('.review').forEach(node => node.remove());
    reviews.forEach(review => {
      const row = document.createElement('div'); row.className = 'review';
      const header = document.createElement('div'); header.className = 'review__header';
      const avatar = document.createElement('div'); avatar.className = 'review__avatar'; avatar.textContent = (review.reviewer?.full_name || 'Cliente').slice(0, 2).toUpperCase();
      const meta = document.createElement('div'); meta.className = 'review__meta';
      const name = document.createElement('span'); name.className = 'review__name'; name.textContent = review.reviewer?.full_name || 'Cliente Nexlar';
      const date = document.createElement('span'); date.className = 'review__date'; date.textContent = new Date(review.created_at).toLocaleDateString('pt-BR'); meta.append(name, date);
      const stars = document.createElement('div'); stars.className = 'review__stars'; stars.textContent = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const comment = document.createElement('p'); comment.className = 'review__text'; comment.textContent = review.comment || 'Sem comentário.';
      header.append(avatar, meta); row.append(header, stars, comment); reviewCard.insertBefore(row, document.getElementById('verTodasBtn'));
    });
    document.getElementById('verTodasBtn').hidden = true;
  } catch (error) { hint.textContent = error.message; return; }

  let rating = 0;
  const stars = document.querySelectorAll('.star-btn');
  const paint = value => stars.forEach((star, index) => { star.textContent = index < value ? '★' : '☆'; star.classList.toggle('active', index < value); });
  stars.forEach(star => {
    const value = Number(star.dataset.value);
    star.addEventListener('mouseenter', () => paint(value)); star.addEventListener('mouseleave', () => paint(rating));
    star.addEventListener('click', async () => {
      rating = value; paint(rating);
      try {
        await api.requireSession();
        const contracts = await api.request(`contracts&provider_id=${encodeURIComponent(providerId)}`);
        const reviewedContracts = new Set((profile.reviews || []).map(review => Number(review.contract_id)));
        const eligible = contracts.find(contract => contract.status === 'concluido' && !reviewedContracts.has(Number(contract.id)));
        if (!eligible) throw new Error('Você poderá avaliar após concluir uma contratação com este profissional.');
        const comment = prompt('Conte como foi o serviço (opcional):') || '';
        await api.request('reviews', { method: 'POST', body: JSON.stringify({ contract_id: eligible.id, rating, comment }) });
        hint.textContent = 'Avaliação enviada com sucesso!'; hint.style.color = '#087443';
        setTimeout(() => location.reload(), 900);
      } catch (error) { hint.textContent = error.message; rating = 0; paint(0); }
    });
    star.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); star.click(); } });
  });
});


