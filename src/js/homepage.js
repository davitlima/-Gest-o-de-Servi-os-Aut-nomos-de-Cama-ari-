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
});

document.addEventListener('DOMContentLoaded', () => {
    // Pegando os elementos
    const searchInput = document.getElementById('search-input');
    const selServico = document.getElementById('sel-servico');
    const selBairro = document.getElementById('sel-bairro');
    const catButtons = document.querySelectorAll('.cat');
    const cards = document.querySelectorAll('.card');

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