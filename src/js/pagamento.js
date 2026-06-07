const metodos = document.querySelectorAll(".metodo");

const pix = document.getElementById("pix");
const cartao = document.getElementById("cartao");

metodos.forEach(metodo => {

    metodo.addEventListener("click", () => {

        metodos.forEach(item => item.classList.remove("ativo"));
        metodo.classList.add("ativo");

        const tipo = metodo.dataset.pagamento;

        if(tipo === "pix"){
            pix.classList.remove("oculto");
            cartao.classList.add("oculto");
        }else{
            cartao.classList.remove("oculto");
            pix.classList.add("oculto");
        }

    });

});

document.querySelector(".copiar").addEventListener("click", () => {

    const codigo = document.querySelector("#pix input");

    navigator.clipboard.writeText(codigo.value);

    alert("Código PIX copiado!");

});

document.querySelector(".btn-pagar").addEventListener("click", () => {
    alert("Pagamento confirmado!");
});