let profileApiPromise;

function loadProfileScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Não foi possível preparar a avaliação. Tente novamente.'));
    document.head.appendChild(script);
  });
}

function getProfileApi() {
  if (window.nexlarReady) return window.nexlarReady;
  profileApiPromise ||= loadProfileScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')
    .then(() => loadProfileScript('/src/js/api.js'))
    .then(() => window.nexlarReady);
  return profileApiPromise;
}

document.addEventListener('DOMContentLoaded', async () => {
  const providerId = new URLSearchParams(location.search).get('id');
  const profileRequest = providerId
    ? fetch(`/api/index.php?route=public%2Fprofile&id=${encodeURIComponent(providerId)}`).then(response => {
      if (!response.ok) throw new Error('Não foi possível carregar o perfil profissional.');
      return response.json();
    })
    : Promise.resolve(null);
  const hint = document.getElementById('starHint');
  let profile = null;
  if (!providerId) { hint.textContent = 'Abra um profissional pela lista para ver o perfil real.'; return; }

  try {
    profile = await profileRequest;
    const reviews = profile.reviews || [];
    const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
    document.querySelector('.hero-card__name').textContent = profile.company_name || profile.full_name;
    document.querySelector('.hero-card__tag').textContent = profile.service_category ? `@${profile.service_category}` : '@profissional';
    document.querySelector('.hero-card__rating').textContent = average.toFixed(1);
    document.querySelector('.hero-card__reviews').textContent = `${reviews.length} avaliações`;
    document.querySelector('.hero-card__location').lastChild.textContent = ` ${profile.neighborhood || 'Camaçari - BA'}`;
    document.querySelector('.about-text').textContent = profile.bio || 'Profissional cadastrado na Nexlar.';
    const profileAvatar = document.querySelector('.hero-card .avatar');
    window.NexlarAvatar.render(profileAvatar, profile.company_name || profile.full_name, profile.avatar_url, { loading: 'eager' });
    const messageLink = document.querySelector('.hero-card .btn--primary'); messageLink.href = window.NexlarChat.professionalChatUrl(providerId);

    const portfolio = document.querySelector('.portfolio-grid'); portfolio.innerHTML = '';
    (profile.portfolio_items || []).forEach(item => {
      const work = document.createElement('figure'); work.className = 'portfolio-entry';
      const images = item.portfolio_item_images?.length ? item.portfolio_item_images : item.images?.length ? item.images : item.image_url ? [{ image_url: item.image_url }] : [];
      const gallery = document.createElement('div'); gallery.className = 'portfolio-entry__gallery';
      images.forEach((entry, index) => {
        const image = document.createElement('img'); image.src = entry.image_url; image.alt = `${item.title || 'Oferta'} — exemplo ${index + 1} de ${images.length}`; image.className = 'portfolio-item'; image.loading = index ? 'lazy' : 'eager'; image.decoding = 'async';
        if (index === 0) image.fetchPriority = 'high';
        gallery.appendChild(image);
      });
      work.appendChild(gallery);
      const body = document.createElement('div'); body.className = 'portfolio-entry__body';
      const title = document.createElement('h3'); title.textContent = item.title || 'Trabalho realizado'; body.appendChild(title);
      if (item.description) {
        const description = document.createElement('p'); description.className = 'portfolio-entry__description'; description.textContent = item.description; body.appendChild(description);
      }
      const price = document.createElement('p'); price.className = 'portfolio-entry__price';
      if (item.price_mode === 'fixo' && Number(item.price) > 0) price.textContent = `R$ ${Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      else if (item.price_mode === 'a_partir_de' && Number(item.price) > 0) price.textContent = `A partir de R$ ${Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      else price.textContent = 'Preço sob consulta';
      body.appendChild(price);
      if (item.estimated_duration) { const duration = document.createElement('p'); duration.className = 'portfolio-entry__duration'; duration.textContent = `Prazo estimado: ${item.estimated_duration}`; body.appendChild(duration); }
      work.appendChild(body);
      const contact = document.createElement('a'); contact.className = 'portfolio-entry__contact'; contact.href = window.NexlarChat.professionalChatUrl(providerId); contact.textContent = 'Conversar sobre este serviço';
      work.appendChild(contact);
      portfolio.appendChild(work);
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
        const api = await getProfileApi();
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



