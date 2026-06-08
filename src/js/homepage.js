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