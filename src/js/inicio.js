document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const selServico = document.getElementById('sel-servico');
    const selBairro = document.getElementById('sel-bairro');
    const catButtons = document.querySelectorAll('.cat');
    const cards = document.querySelectorAll('.card');

    const normalizar = (texto) => texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    function filtrar() {
        const termoBusca = normalizar(searchInput.value);
        const servicoSelecionado = selServico.value;
        const bairroSelecionado = selBairro.value;
        const botaoAtivo = document.querySelector('.cat.active');
        const categoriaPeloBotao = botaoAtivo ? botaoAtivo.dataset.cat : "";

        cards.forEach(card => {
            const textoDoCard = normalizar(card.textContent);
            const categoriaDoCard = card.dataset.cat;
            const bairroDoCard = card.dataset.bairro;

            const bateBusca = textoDoCard.includes(termoBusca);
            const bateServico = servicoSelecionado === "" || categoriaDoCard === servicoSelecionado;
            const bateBairro = bairroSelecionado === "" || bairroDoCard === bairroSelecionado;
            const bateBotao = categoriaPeloBotao === "" || categoriaDoCard === categoriaPeloBotao;

            card.classList.toggle('hidden', !(bateBusca && bateServico && bateBairro && bateBotao));
        });
    }

    searchInput.addEventListener('input', filtrar);
    selServico.addEventListener('change', filtrar);
    selBairro.addEventListener('change', filtrar);

    catButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
            } else {
                catButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            filtrar();
        });
    });
});