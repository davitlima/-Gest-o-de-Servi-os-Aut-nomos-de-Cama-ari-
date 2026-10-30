document.addEventListener('DOMContentLoaded', async () => {
    try {
        const api = await window.nexlarReady;
        const professionals = await api.request('public/profiles');
        if (professionals.length) {
            const container = document.getElementById('cards');
            container.innerHTML = '';
            professionals.forEach(professional => {
                const name = professional.company_name || professional.full_name;
                const reviews = professional.reviews || [];
                const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
                const card = document.createElement('div'); card.className = 'card';
                card.dataset.cat = (professional.service_category || '').toLowerCase(); card.dataset.bairro = (professional.neighborhood || '').toLowerCase(); card.style.cursor = 'pointer';
                const top = document.createElement('div'); top.className = 'card-top';
                const avatar = document.createElement('div'); avatar.className = 'av'; avatar.textContent = name.slice(0, 1).toUpperCase();
                const info = document.createElement('div'); info.className = 'card-info';
                const strong = document.createElement('strong'); strong.textContent = name;
                const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = `@${professional.service_category || 'serviços'}`;
                const location = document.createElement('span'); location.className = 'loc'; location.textContent = professional.neighborhood || 'Camaçari';
                const bio = document.createElement('p'); bio.textContent = professional.bio || 'Profissional cadastrado na Nexlar.';
                const rating = document.createElement('div'); rating.className = 'rating'; rating.textContent = `${average.toFixed(1)} ★ (${reviews.length} avaliações)`;
                const button = document.createElement('button'); button.className = 'btn-msg'; button.textContent = 'Enviar mensagem';
                button.addEventListener('click', event => { event.stopPropagation(); location.href = `painelmensagens.html?provider_id=${encodeURIComponent(professional.id)}`; });
                card.addEventListener('click', () => location.href = `perfilAutonomo.html?id=${encodeURIComponent(professional.id)}`);
                info.append(strong, tag, location); top.append(avatar, info); card.append(top, bio, rating, button); container.appendChild(card);
            });
        }
    } catch (_) {
        // Mantém os exemplos existentes quando o backend ainda não foi configurado.
    }
    // Pegando os elementos
    const searchInput = document.getElementById('search-input');
    const selServico = document.getElementById('sel-servico');
    const selBairro = document.getElementById('sel-bairro');
    const catButtons = document.querySelectorAll('.cat');
    const cards = document.querySelectorAll('#cards .card');

    function filtrar() {
        const termoBusca = searchInput.value.toLowerCase();
        const servicoSelecionado = selServico.value;
        const bairroSelecionado = selBairro.value;
        
        // Categoria ativa pelos botões
        const botaoAtivo = document.querySelector('.cat.active');
        const categoriaPeloBotao = botaoAtivo ? botaoAtivo.dataset.cat : "";

        cards.forEach(card => {
            const nomeProfissional = card.querySelector('strong').innerText.toLowerCase();
            const categoriaDoCard = card.dataset.cat; // ex: "construcao"
            const bairroDoCard = card.dataset.bairro; // ex: "centro"

            // Regras de filtragem
            const bateNome = nomeProfissional.includes(termoBusca);
            const bateServico = servicoSelecionado === "" || categoriaDoCard === servicoSelecionado;
            const bateBairro = bairroSelecionado === "" || bairroDoCard === bairroSelecionado;
            const bateBotao = categoriaPeloBotao === "" || categoriaDoCard === categoriaPeloBotao;

            // Só mostra se passar em TODOS os filtros
            if (bateNome && bateServico && bateBairro && bateBotao) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    }

    // Eventos de digitação e seleção
    searchInput.addEventListener('input', filtrar);
    selServico.addEventListener('change', filtrar);
    selBairro.addEventListener('change', filtrar);

    // Evento de clique nos botões de categoria
    catButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) {
                btn.classList.remove('active'); // Se já está ativo, desmarca
            } else {
                catButtons.forEach(b => b.classList.remove('active')); // Limpa outros
                btn.classList.add('active'); // Marca o novo
            }
            filtrar();
        });
    });
});
