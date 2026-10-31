document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('cards');
  const searchInput = document.getElementById('search-input');
  const serviceSelect = document.getElementById('sel-servico');
  const neighborhoodSelect = document.getElementById('sel-bairro');
  const categoryButtons = [...document.querySelectorAll('.cat')];
  let cards = [];

  const normalize = value => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  function filterCards() {
    const search = normalize(searchInput?.value);
    const service = normalize(serviceSelect?.value);
    const neighborhood = normalize(neighborhoodSelect?.value);
    const activeCategory = normalize(document.querySelector('.cat.active')?.dataset.cat);
    cards.forEach(card => {
      const matches = (!search || normalize(card.textContent).includes(search))
        && (!service || normalize(card.dataset.cat) === service)
        && (!neighborhood || normalize(card.dataset.bairro) === neighborhood)
        && (!activeCategory || normalize(card.dataset.cat) === activeCategory);
      card.hidden = !matches;
    });
  }

  function createCard(professional) {
    const name = professional.company_name || professional.full_name;
    const reviews = professional.reviews || [];
    const average = reviews.length ? reviews.reduce((sum, item) => sum + Number(item.rating), 0) / reviews.length : 0;
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.cat = normalize(professional.service_category);
    card.dataset.bairro = normalize(professional.neighborhood);
    card.tabIndex = 0;

    const top = document.createElement('div'); top.className = 'card-top';
    const avatar = document.createElement('div'); avatar.className = 'av'; avatar.textContent = name.slice(0, 1).toUpperCase();
    const info = document.createElement('div'); info.className = 'card-info';
    const title = document.createElement('strong'); title.textContent = name;
    const category = document.createElement('span'); category.className = 'tag'; category.textContent = professional.service_category || 'Serviços';
    const location = document.createElement('span'); location.className = 'loc'; location.textContent = professional.neighborhood || 'Camaçari';
    info.append(title, category, location); top.append(avatar, info);

    const bio = document.createElement('p'); bio.textContent = professional.bio || 'Perfil profissional cadastrado na Nexlar.';
    const rating = document.createElement('div'); rating.className = 'rating';
    rating.textContent = reviews.length ? `${average.toFixed(1)} ★ (${reviews.length} avaliações)` : 'Ainda sem avaliações';

    const actions = document.createElement('div'); actions.className = 'card-actions';
    const profile = document.createElement('a'); profile.className = 'btn-perfil'; profile.textContent = 'Ver perfil';
    profile.href = `/src/pages/perfilAutonomo.html?id=${encodeURIComponent(professional.id)}`;
    const message = document.createElement('a'); message.className = 'btn-msg'; message.textContent = 'Enviar mensagem';
    message.href = `/src/pages/painelmensagens.html?provider_id=${encodeURIComponent(professional.id)}`;
    actions.append(profile, message); card.append(top, bio, rating, actions);
    return card;
  }

  if (container) {
    try {
      const api = await window.nexlarReady;
      const professionals = await api.request('public/profiles');
      container.innerHTML = '';
      if (!professionals.length) {
        const empty = document.createElement('p'); empty.className = 'empty-state';
        empty.textContent = 'Ainda não há profissionais cadastrados.';
        container.appendChild(empty);
      } else {
        cards = professionals.map(createCard);
        container.append(...cards);
      }
    } catch (error) {
      container.innerHTML = '';
      const failure = document.createElement('p'); failure.className = 'empty-state';
      failure.textContent = 'Não foi possível carregar os profissionais agora.';
      container.appendChild(failure);
    }
  }

  searchInput?.addEventListener('input', filterCards);
  serviceSelect?.addEventListener('change', filterCards);
  neighborhoodSelect?.addEventListener('change', filterCards);
  categoryButtons.forEach(button => button.addEventListener('click', () => {
    const wasActive = button.classList.contains('active');
    categoryButtons.forEach(item => item.classList.remove('active'));
    if (!wasActive && button.dataset.cat) button.classList.add('active');
    filterCards();
  }));

  const amountInput = document.getElementById('input-valor');
  amountInput?.addEventListener('input', () => {
    const amount = Math.max(0, Number(amountInput.value) || 0);
    const currency = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('valor-receber').textContent = currency(amount * 0.85);
    document.getElementById('valor-taxa').textContent = `Taxa da plataforma: ${currency(amount * 0.15)}`;
  });
});

