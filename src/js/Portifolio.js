document.addEventListener("DOMContentLoaded", () => {
    // 1. SELEÇÃO DE ELEMENTOS DA TELA
    const btnAlterarFoto = document.querySelector(".btn-alterar-foto") || document.querySelector("button:contains('Alterar Foto')") || document.querySelectorAll("button")[0]; // Adapte a classe se necessário
    const btnAdicionarFoto = document.querySelector(".card-adicionar") || document.querySelector("main div button") || document.querySelector("+ Adicionar Foto")?.parentElement; 
    
    // Como não tenho seu HTML exato, vamos criar os inputs de arquivo escondidos dinamicamente
    const inputFotoPerfil = document.createElement("input");
    inputFotoPerfil.type = "file";
    inputFotoPerfil.accept = "image/*";

    const inputFotoPortfolio = document.createElement("input");
    inputFotoPortfolio.type = "file";
    inputFotoPortfolio.accept = "image/*";
    inputFotoPortfolio.multiple = true; // Permite escolher várias fotos pro portfólio

    // CONTAINER ONDE AS FOTOS DO PORTFÓLIO VÃO FICAR
    // Procura o local perto do botão de adicionar para colocar as novas fotos
    const portfolioContainer = document.querySelector(".portfolio-grid") || btnAdicionarFoto?.parentElement;

    // 2. FUNÇÃO: ALTERAR FOTO DE PERFIL (A bolinha roxa 'JS')
    const fotoPerfilUsuario = document.querySelector(".avatar, .profile-pic") || document.querySelector("main div span, main div div"); // Alvo da foto 'JS'
    
    if(btnAlterarFoto) {
        btnAlterarFoto.addEventListener("click", () => inputFotoPerfil.click());
    }
    
    inputFotoPerfil.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (fotoPerfilUsuario) {
                    // Substitui o texto 'JS' pela imagem escolhida
                    fotoPerfilUsuario.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. FUNÇÃO: ADICIONAR FOTOS AO PORTFÓLIO
    if (btnAdicionarFoto) {
        // Estiliza o botão de adicionar para garantir que ele responda ao clique
        btnAdicionarFoto.style.cursor = "pointer";
        btnAdicionarFoto.addEventListener("click", () => inputFotoPortfolio.click());
    }

    inputFotoPortfolio.addEventListener("change", (e) => {
        const files = e.target.files;
        
        for (let file of files) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // Cria o quadrado da nova foto
                const novoCard = document.createElement("div");
                novoCard.className = "portfolio-item-card";
                novoCard.style.cssText = `
                    width: 150px;
                    height: 150px;
                    border-radius: 12px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                `;

                // Coloca a imagem dentro do quadrado e um botão de deletar por cima
                novoCard.innerHTML = `
                    <img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover;">
                    <button class="btn-delete-foto" style="
                        position: absolute; top: 5px; right: 5px; 
                        background: #ff4d4d; color: white; border: none; 
                        border-radius: 50%; width: 25px; height: 25px; 
                        cursor: pointer; font-weight: bold;
                    ">X</button>
                `;

                // Funcionalidade de excluir a foto caso clique no X
                novoCard.querySelector(".btn-delete-foto").addEventListener("click", () => {
                    novoCard.remove();
                });

                // Coloca a foto na tela ANTES do botão de adicionar mais fotos
                if (portfolioContainer && btnAdicionarFoto) {
                    portfolioContainer.insertBefore(novoCard, btnAdicionarFoto);
                }
            };
            reader.readAsDataURL(file);
        }
    });
});