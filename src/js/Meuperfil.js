document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tabs .tab");
  const profileCard = document.querySelector(".profile-card");

  let portfolioSection = document.getElementById("portfolio-content");
  if (!portfolioSection) {
    portfolioSection = document.createElement("div");
    portfolioSection.id = "portfolio-content";
    portfolioSection.style.display = "none";
    portfolioSection.innerHTML = `
      <h3>Meu Portfólio</h3>
      <p style="color: var(--muted); margin-bottom: 20px;">Adicione fotos e detalhes dos seus melhores trabalhos executados.</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px;">
        <div style="border: 2px dashed var(--border); border-radius: var(--radius); height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: var(--muted); transition: border-color 0.2s;"
          onmouseover="this.style.borderColor='var(--accent)'"
          onmouseout="this.style.borderColor='var(--border)'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 8px;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span style="font-size: 0.8rem; font-weight: 600;">Adicionar Foto</span>
        </div>
      </div>
    `;
    profileCard.appendChild(portfolioSection);
  }

  const profileForm = document.querySelector(".profile-form");
  const profileTitle = profileCard.querySelector("h3");

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      if (index === 0) {
        profileForm.style.display = "flex";
        profileTitle.style.display = "block";
        portfolioSection.style.display = "none";
      } else {
        profileForm.style.display = "none";
        profileTitle.style.display = "none";
        portfolioSection.style.display = "block";
      }
    });
  });

  const btnPhoto = document.querySelector(".btn-photo");
  const avatarDiv = document.querySelector(".profile-photo .avatar");

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  btnPhoto.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        avatarDiv.textContent = "";
        avatarDiv.style.backgroundImage = `url('${e.target.result}')`;
        avatarDiv.style.backgroundSize = "cover";
        avatarDiv.style.backgroundPosition = "center";
      };
      reader.readAsDataURL(file);
    }
  });

  const form = document.querySelector(".profile-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btnSave = document.querySelector(".btn-save");
      const originalText = btnSave.textContent;

      btnSave.textContent = "Salvando...";
      btnSave.disabled = true;
      btnSave.style.opacity = "0.7";

      setTimeout(() => {
        btnSave.textContent = "Anotações Salvas com Sucesso! ✓";
        btnSave.style.background = "var(--green)";

        setTimeout(() => {
          btnSave.textContent = originalText;
          btnSave.style.background = "";
          btnSave.disabled = false;
          btnSave.style.opacity = "";
        }, 2000);
      }, 1200);
    });
  }

  const btnLogout = document.querySelector(".btn-outline");
  const btnDelete = document.querySelector(".btn-danger");

  const homePath = "../../index.html";

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("Tem certeza que deseja sair do sistema Nexlar?")) {
        window.location.href = homePath;
      }
    });
  }

  if (btnDelete) {
    btnDelete.addEventListener("click", () => {
      const confirmacao = prompt('Para excluir sua conta definitivamente, digite "DELETAR":');

      if (confirmacao !== null) {

        if (confirmacao.trim() === "DELETAR") {
          alert("Sua conta foi removida de nossa base de dados.");
          window.location.href = homePath;
        } else {
          alert("Palavra incorreta. A exclusão foi cancelada.");
        }
      }
    });
  }

  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
});
