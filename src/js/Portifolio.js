document.addEventListener("DOMContentLoaded", () => {

    // Escuta mudanças de rotas ou interações de abas se necessário
    const tabs = document.querySelectorAll(".tab-item");
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
        })
    });


    const btnAlterarFoto = document.querySelector(".btn-alterar-foto") || document.querySelector("button:contains('Alterar Foto')") || document.querySelectorAll("button")[0]; // Adapte a classe se necessário
    const btnAdicionarFoto = document.querySelector(".card-adicionar") || document.querySelector("main div button") || document.querySelector("+ Adicionar Foto")?.parentElement;


    const inputFotoPerfil = document.createElement("input");
    inputFotoPerfil.type = "file";
    inputFotoPerfil.accept = "image/*";

    const inputFotoPortfolio = document.createElement("input");
    inputFotoPortfolio.type = "file";
    inputFotoPortfolio.accept = "image/*";
    inputFotoPortfolio.multiple = true;


    const portfolioContainer = document.querySelector(".portfolio-grid") || btnAdicionarFoto?.parentElement;

    const fotoPerfilUsuario = document.querySelector(".avatar, .profile-pic") || document.querySelector("main div span, main div div");

    if (btnAlterarFoto) {
        btnAlterarFoto.addEventListener("click", () => inputFotoPerfil.click());
    }

    inputFotoPerfil.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (fotoPerfilUsuario) {

                    fotoPerfilUsuario.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                }
            };
            reader.readAsDataURL(file);
        }

    });
});


function toggleModal(show) {
    const modal = document.getElementById('modalOverlay');
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';


        if (btnAdicionarFoto) {

            btnAdicionarFoto.style.cursor = "pointer";
            btnAdicionarFoto.addEventListener("click", () => inputFotoPortfolio.click());

        }
    }

    function handleFile(input) {
        if (input.files && input.files.length > 0) {
            const grid = document.getElementById('portfolioGrid');
            const labelButton = document.getElementById('btnAdicionarFoto');

            // Itera sobre todos os arquivos selecionados (suporta seleção múltipla)
            Array.from(input.files).forEach(file => {
                if (!file.type.startsWith('image/')) return; // Ignora se não for imagem

                const reader = new FileReader();

                reader.onload = function (e) {
                    // Cria a estrutura do item utilizando as classes mapeadas no CSS
                    const item = document.createElement('div');
                    item.className = 'portfolio-item';

                    item.innerHTML = `
                    <img src="${e.target.result}" alt="Foto do Portfólio">
                    <button class="btn-delete" title="Excluir Foto">X</button>
                    `;

                    item.querySelector('.btn-delete').addEventListener('click', () => {
                        item.remove();
                    });

                    if (grid && labelButton) {
                        grid.insertBefore(item, labelButton);

                        reader.onload = (event) => {

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

                            novoCard.innerHTML = `
                            <img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover;">
                            <button class="btn-delete-foto" style="
                                position: absolute; top: 5px; right: 5px; 
                                background: #ff4d4d; color: white; border: none; 
                                border-radius: 50%; width: 25px; height: 25px; 
                                cursor: pointer; font-weight: bold;
                            ">X</button>
                            `;

                            novoCard.querySelector(".btn-delete-foto").addEventListener("click", () => {
                                novoCard.remove();
                            });

                            if (portfolioContainer && btnAdicionarFoto) {
                                portfolioContainer.insertBefore(novoCard, btnAdicionarFoto);

                            }
                        };

                        reader.readAsDataURL(file);
                    }}});

            input.value = '';
        }
    }
}