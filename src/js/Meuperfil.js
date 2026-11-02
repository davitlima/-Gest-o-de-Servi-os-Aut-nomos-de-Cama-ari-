document.addEventListener('DOMContentLoaded', async () => {
  const api = await window.nexlarReady;
  const session = await api.requireSession();
  const me = await api.request('me');
  const canOffer = me.role === 'autonomo' || me.role === 'empresa';
  const form = document.querySelector('.profile-form');
  const tabs = document.querySelectorAll('.tabs .tab');
  const profileCard = document.querySelector('.profile-card');
  const profileTitle = profileCard.querySelector('h3');
  const portfolioTab = document.getElementById('portfolioTab');

  document.getElementById('profileName').value = me.full_name || '';
  document.getElementById('profilePhone').value = me.phone || '';
  document.getElementById('profileEmail').value = session.user.email || '';
  document.getElementById('profileNeighborhood').value = me.neighborhood || '';
  document.getElementById('profileBio').value = me.bio || '';
  const avatar = document.querySelector('.profile-photo .avatar');
  if (me.avatar_url) { avatar.textContent = ''; avatar.style.background = `url("${me.avatar_url}") center/cover`; }
  else avatar.textContent = me.full_name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

  const avatarTrigger = document.querySelector('.btn-photo');
  const avatarModal = document.getElementById('avatarUploadModal');
  const avatarPanel = avatarModal.querySelector('.avatar-modal__panel');
  const avatarDropzone = document.getElementById('avatarDropzone');
  const avatarInput = document.getElementById('avatarFileInput');
  const avatarPreview = document.getElementById('avatarUploadPreview');
  const avatarFileName = document.getElementById('avatarFileName');
  const avatarMessage = document.getElementById('avatarUploadMessage');
  const avatarCancel = document.getElementById('cancelAvatarUpload');
  const avatarClose = document.getElementById('closeAvatarUpload');
  const avatarSave = document.getElementById('saveAvatarUpload');
  const emptyPreview = avatarPreview.innerHTML;
  const emptyFileName = avatarFileName.textContent;
  let selectedAvatar = null;
  let previewUrl = null;
  let avatarSaving = false;

  function clearAvatarSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    selectedAvatar = null;
    avatarInput.value = '';
    avatarPreview.innerHTML = emptyPreview;
    avatarFileName.textContent = emptyFileName;
    avatarMessage.textContent = '';
    avatarMessage.className = 'avatar-upload-message';
    avatarSave.disabled = true;
    avatarDropzone.classList.remove('is-dragging');
  }

  function openAvatarModal() {
    clearAvatarSelection();
    avatarModal.hidden = false;
    document.body.classList.add('avatar-modal-open');
    avatarClose.focus();
  }

  function closeAvatarModal() {
    if (avatarSaving) return;
    avatarModal.hidden = true;
    document.body.classList.remove('avatar-modal-open');
    clearAvatarSelection();
    avatarTrigger.focus();
  }

  function chooseAvatar(files) {
    const { file, validation } = window.NexlarProfileUpload.selectProfileImage(files);
    if (!validation.valid) {
      clearAvatarSelection();
      avatarMessage.textContent = validation.error;
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    selectedAvatar = file;
    previewUrl = URL.createObjectURL(file);
    const image = document.createElement('img');
    image.src = previewUrl;
    image.alt = `Prévia de ${file.name}`;
    avatarPreview.replaceChildren(image);
    avatarFileName.textContent = file.name;
    avatarMessage.textContent = 'Imagem pronta para salvar.';
    avatarMessage.className = 'avatar-upload-message is-success';
    avatarSave.disabled = false;
  }

  avatarTrigger.addEventListener('click', openAvatarModal);
  avatarDropzone.addEventListener('click', () => avatarInput.click());
  avatarInput.addEventListener('change', () => chooseAvatar(avatarInput.files));
  ['dragenter', 'dragover'].forEach(type => avatarDropzone.addEventListener(type, event => {
    event.preventDefault();
    avatarDropzone.classList.add('is-dragging');
  }));
  ['dragleave', 'dragend'].forEach(type => avatarDropzone.addEventListener(type, () => avatarDropzone.classList.remove('is-dragging')));
  avatarDropzone.addEventListener('drop', event => {
    event.preventDefault();
    avatarDropzone.classList.remove('is-dragging');
    chooseAvatar(event.dataTransfer.files);
  });
  avatarCancel.addEventListener('click', closeAvatarModal);
  avatarClose.addEventListener('click', closeAvatarModal);
  avatarModal.addEventListener('click', event => { if (event.target === avatarModal) closeAvatarModal(); });

  document.addEventListener('keydown', event => {
    if (avatarModal.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closeAvatarModal(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...avatarPanel.querySelectorAll('button:not(:disabled)')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  avatarSave.addEventListener('click', async () => {
    if (!selectedAvatar || avatarSaving) return;
    avatarSaving = true;
    avatarSave.disabled = true;
    avatarSave.textContent = 'Salvando...';
    avatarPanel.setAttribute('aria-busy', 'true');
    avatarMessage.textContent = 'Enviando sua foto...';
    avatarMessage.className = 'avatar-upload-message';

    try {
      const { publicUrl } = await window.NexlarProfileUpload.uploadProfileAvatar({
        bucket: api.supabase.storage.from('avatars'),
        userId: session.user.id,
        file: selectedAvatar,
        updateProfile: avatarUrl => api.request('me', {
          method: 'PATCH',
          body: JSON.stringify({ avatar_url: avatarUrl }),
        }),
      });
      avatar.textContent = '';
      avatar.style.background = `url("${publicUrl}") center/cover`;
      avatarMessage.textContent = 'Foto atualizada com sucesso.';
      avatarMessage.className = 'avatar-upload-message is-success';
      setTimeout(closeAvatarModal, 500);
    } catch (error) {
      avatarMessage.textContent = error.message || 'Não foi possível salvar a foto. Tente novamente.';
      avatarMessage.className = 'avatar-upload-message';
      avatarSave.disabled = false;
    } finally {
      avatarSaving = false;
      avatarSave.textContent = 'Salvar foto';
      avatarPanel.removeAttribute('aria-busy');
    }
  });

  let portfolioSection = null;
  if (canOffer) {
    portfolioSection = document.createElement('div'); portfolioSection.id = 'portfolio-content'; portfolioSection.style.display = 'none';
    profileCard.appendChild(portfolioSection);
    await renderPortfolio();
  } else {
    portfolioTab.hidden = true;
  }

  async function renderPortfolio() {
    const items = await api.request('portfolio');
    portfolioSection.innerHTML = '<h3>Meu Portfólio</h3><p>Adicione imagens dos seus trabalhos concluídos.</p>';
    const grid = document.createElement('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px';
    const add = document.createElement('button'); add.type = 'button'; add.textContent = '+ Adicionar trabalho'; add.style.cssText = 'min-height:150px;border:2px dashed var(--border);background:white;border-radius:12px;cursor:pointer';
    add.addEventListener('click', async () => {
      const image_url = prompt('Cole a URL pública da foto do trabalho:'); if (!image_url) return;
      const description = prompt('Descrição do trabalho (opcional):') || '';
      try { await api.request('portfolio', { method: 'POST', body: JSON.stringify({ image_url, description }) }); await renderPortfolio(); }
      catch (error) { alert(error.message); }
    });
    grid.appendChild(add);
    items.forEach(item => {
      const card = document.createElement('figure'); card.style.cssText = 'margin:0;position:relative;border-radius:12px;overflow:hidden;border:1px solid var(--border)';
      const image = document.createElement('img'); image.src = item.image_url; image.alt = item.description || 'Trabalho do portfólio'; image.style.cssText = 'width:100%;height:150px;object-fit:cover;display:block';
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Excluir'; remove.style.cssText = 'position:absolute;right:8px;bottom:8px;padding:6px 10px';
      remove.addEventListener('click', async () => { if (confirm('Excluir esta imagem?')) { await api.request(`portfolio/${item.id}`, { method: 'DELETE' }); await renderPortfolio(); } });
      card.append(image, remove); grid.appendChild(card);
    });
    portfolioSection.appendChild(grid);
  }

  tabs.forEach((tab, index) => tab.addEventListener('click', () => {
    tabs.forEach(item => item.classList.remove('active')); tab.classList.add('active');
    const portfolioOpen = index === 1 && portfolioSection;
    form.style.display = portfolioOpen ? 'none' : 'flex'; profileTitle.style.display = portfolioOpen ? 'none' : 'block';
    if (portfolioSection) portfolioSection.style.display = portfolioOpen ? 'block' : 'none';
  }));

  form.addEventListener('submit', async event => {
    event.preventDefault(); const button = form.querySelector('.btn-save'); button.disabled = true; button.textContent = 'Salvando...';
    try {
      await api.request('me', { method: 'PATCH', body: JSON.stringify({
        full_name: document.getElementById('profileName').value.trim(), phone: document.getElementById('profilePhone').value.trim(),
        neighborhood: document.getElementById('profileNeighborhood').value.trim(), bio: document.getElementById('profileBio').value.trim(),
      }) });
      button.textContent = 'Dados salvos ✓';
    } catch (error) { alert(error.message); button.textContent = 'Salvar alterações'; }
    setTimeout(() => { button.disabled = false; button.textContent = 'Salvar alterações'; }, 1500);
  });

  document.querySelector('.btn-outline').addEventListener('click', async () => { await api.supabase.auth.signOut(); location.href = '/'; });
  document.querySelector('.btn-danger').addEventListener('click', () => alert('Para excluir sua conta com segurança, solicite ao suporte Nexlar.'));
});



