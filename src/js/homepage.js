const inputValor = document.getElementById('input-valor');
const displayReceber = document.getElementById('valor-receber');
const displayTaxa = document.getElementById('valor-taxa');

inputValor.addEventListener('input', () => {
    let valorSugerido = parseFloat(inputValor.value);

    if (isNaN(valorSugerido) || valorSugerido < 0) {
        displayReceber.innerText = "R$ 0,00";
        displayTaxa.innerText = "Taxa da plataforma: R$ 0,00";
        return;
    }

    const valorFinal = valorSugerido * 0.85;
    const valorTaxa = valorSugerido * 0.15;

    const formatar = (valor) => 
        valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    displayReceber.innerText = formatar(valorFinal);
    displayTaxa.innerText = `Taxa da plataforma: ${formatar(valorTaxa)}`;

    window.addEventListener('load', () => {
    new window.VLibras.Widget('https://vlibras.gov.br/app');
    });
});

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
