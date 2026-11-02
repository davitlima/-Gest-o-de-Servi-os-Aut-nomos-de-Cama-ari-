document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('cards');
  if (!container) return;
  const searchInput = document.getElementById('search-input');
  const serviceSelect = document.getElementById('sel-servico');
  const neighborhoodSelect = document.getElementById('sel-bairro');
  const categoryButtons = [...document.querySelectorAll('.cat[data-cat]')];
  let cards = [];
  window.nexlarReady?.catch(() => {});

  const clearButton = document.getElementById('clear-filters');
  const count = document.getElementById('results-count');
  const empty = document.getElementById('no-results');
  const filters = () => ({
    search: searchInput?.value,
    service: serviceSelect?.value,
    neighborhood: neighborhoodSelect?.value,
  });

  function applyFilters() {
    const current = filters();
    let visible = 0;
    cards.forEach(card => {
      const show = window.NexlarMarketplace.matches({
        name: card.dataset.name, service: card.dataset.service,
        neighborhood: card.dataset.neighborhood, bio: card.dataset.bio,
      }, current);
      card.hidden = !show;
      if (show) visible++;
    });
    if (count) count.textContent = `${visible} ${visible === 1 ? 'profissional encontrado' : 'profissionais encontrados'}`;
    if (empty) empty.hidden = cards.length === 0 || visible !== 0;
    if (clearButton) clearButton.hidden = !current.search && !current.service && !current.neighborhood;
  }

  function createCard(professional) {
    const name = professional.company_name || professional.full_name || 'Profissional';
    const category = professional.service_category || 'Serviços';
    const neighborhood = professional.neighborhood || '';
    const bioText = professional.bio || 'Perfil profissional cadastrado na Nexlar.';
    const reviews = professional.reviews || [];
    const average = reviews.length ? reviews.reduce((sum, item) => sum + Number(item.rating), 0) / reviews.length : 0;
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.profileId = professional.id;
    card.dataset.name = name;
    card.dataset.service = category;
    card.dataset.neighborhood = neighborhood;
    card.dataset.bio = bioText;

    const top = document.createElement('div'); top.className = 'card-top';
    const avatar = document.createElement('div'); avatar.className = 'av';
    window.NexlarAvatar.render(avatar, name, professional.avatar_url);
    const info = document.createElement('div'); info.className = 'card-info';
    const title = document.createElement('strong'); title.textContent = name;
    const categoryLabel = document.createElement('span'); categoryLabel.className = 'tag'; categoryLabel.textContent = category;
    const location = document.createElement('span'); location.className = 'loc'; location.textContent = neighborhood || 'Camaçari';
    info.append(title, categoryLabel, location); top.append(avatar, info);
    const bio = document.createElement('p'); bio.textContent = bioText;
    const rating = document.createElement('div'); rating.className = 'rating';
    rating.textContent = reviews.length ? `${average.toFixed(1)} ★ (${reviews.length} avaliações)` : 'Ainda sem avaliações';
    const actions = document.createElement('div'); actions.className = 'card-actions';
    const profile = document.createElement('a'); profile.className = 'btn-perfil'; profile.textContent = 'Ver perfil';
    profile.href = `/src/pages/perfilAutonomo.html?id=${encodeURIComponent(professional.id)}`;
    const message = document.createElement('a'); message.className = 'btn-msg'; message.textContent = 'Enviar mensagem';
    message.href = window.NexlarChat.professionalChatUrl(professional.id);
    actions.append(profile, message); card.append(top, bio, rating, actions);
    return card;
  }

  async function loadProfiles() {
    try {
      // Public list request runs at once while the page configuration/session initializes.
      const publicFetch = fetch('/api/index.php?route=public%2Fprofiles').then(async response => {
        if (!response.ok) throw new Error('Falha ao carregar profissionais.');
        return response.json();
      });
      const professionals = await publicFetch;
      cards = professionals.map(createCard);
      container.replaceChildren(...cards);
      if (!cards.length) {
        const message = document.createElement('p'); message.className = 'empty-state';
        message.textContent = 'Ainda não há profissionais cadastrados.'; container.appendChild(message);
      }
      applyFilters();
    } catch (_) {
      const failure = document.createElement('p'); failure.className = 'empty-state';
      failure.textContent = 'Não foi possível carregar os profissionais agora.';
      container.replaceChildren(failure);
    }
  }

  function syncCategory() {
    const selected = window.NexlarMarketplace.normalize(serviceSelect?.value);
    categoryButtons.forEach(button => button.classList.toggle('active',
      Boolean(selected) && window.NexlarMarketplace.normalize(button.dataset.cat) === selected));
  }
  searchInput?.addEventListener('input', applyFilters);
  serviceSelect?.addEventListener('change', () => { syncCategory(); applyFilters(); });
  neighborhoodSelect?.addEventListener('change', applyFilters);
  categoryButtons.forEach(button => button.addEventListener('click', () => {
    const value = button.dataset.cat || '';
    serviceSelect.value = window.NexlarMarketplace.normalize(serviceSelect.value) === window.NexlarMarketplace.normalize(value) ? '' : value;
    syncCategory(); applyFilters();
  }));
  clearButton?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (serviceSelect) serviceSelect.value = '';
    if (neighborhoodSelect) neighborhoodSelect.value = '';
    syncCategory(); applyFilters(); searchInput?.focus();
  });

  window.addEventListener('storage', event => {
    if (event.key !== 'nexlar:avatar-updated') return;
    try {
      const update = JSON.parse(event.newValue);
      const card = cards.find(item => item.dataset.profileId === update.userId);
      if (card) window.NexlarAvatar.render(card.querySelector('.av'), card.dataset.name, update.avatarUrl);
    } catch (_) { /* Ignore malformed cross-tab notifications. */ }
  });
  loadProfiles();

  const amountInput = document.getElementById('input-valor');
  amountInput?.addEventListener('input', () => {
    const amount = Math.max(0, Number(amountInput.value) || 0);
    const currency = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('valor-receber').textContent = currency(amount * 0.85);
    document.getElementById('valor-taxa').textContent = `Taxa da plataforma: ${currency(amount * 0.15)}`;
  });
});
