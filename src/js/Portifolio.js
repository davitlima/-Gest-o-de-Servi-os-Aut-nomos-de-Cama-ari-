document.addEventListener("DOMContentLoaded", () => {
    // Escuta mudanças de rotas ou interações de abas se necessário
    const tabs = document.querySelectorAll(".tab-item");
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
        });
    });
});

function toggleModal(show) {
    const modal = document.getElementById('modalOverlay');
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
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
            reader.onload = function(e) {
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
                }
            };

            reader.readAsDataURL(file);
        });

        input.value = '';
    }
}