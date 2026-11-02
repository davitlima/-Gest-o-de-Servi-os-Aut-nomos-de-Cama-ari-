document.addEventListener('DOMContentLoaded', async () => {
  const api = await window.nexlarReady;
  const session = await api.requireSession();
  const me = await api.request('me');
  const canOffer = me.role === 'autonomo' || me.role === 'empresa';
  const serviceField = document.getElementById('profileService');
  const neighborhoodField = document.getElementById('profileNeighborhood');
  const normalizeLabel = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const setProviderValue = (field, value) => {
    const option = [...field.options].find(item => item.value && normalizeLabel(item.value) === normalizeLabel(value));
    if (value && !option) field.add(new Option(`Atual: ${value}`, value));
    field.value = option?.value || value || '';
  };
  const form = document.querySelector('.profile-form');
  const tabs = document.querySelectorAll('.tabs .tab');
  const profileCard = document.querySelector('.profile-card');
  const profileTitle = profileCard.querySelector('h3');
  const portfolioTab = document.getElementById('portfolioTab');

  document.getElementById('profileName').value = me.full_name || '';
  document.getElementById('profilePhone').value = me.phone || '';
  document.getElementById('profileEmail').value = session.user.email || '';
  document.querySelectorAll('.provider-profile-field').forEach(group => {
    group.hidden = !canOffer;
    group.querySelector('select').disabled = !canOffer;
  });
  if (canOffer) {
    setProviderValue(serviceField, me.service_category);
    setProviderValue(neighborhoodField, me.neighborhood);
  }
  document.getElementById('profileBio').value = me.bio || '';
  const avatar = document.querySelector('.profile-photo .avatar');
  window.NexlarAvatar.render(avatar, me.full_name, me.avatar_url);

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
      window.NexlarAvatar.render(avatar, me.full_name, publicUrl);
      localStorage.setItem('nexlar:avatar-updated', JSON.stringify({ userId: session.user.id, avatarUrl: publicUrl, updatedAt: Date.now() }));
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
    portfolioSection = document.createElement('section');
    portfolioSection.id = 'portfolio-content';
    portfolioSection.className = 'portfolio-content';
    portfolioSection.hidden = true;
    profileCard.appendChild(portfolioSection);
    await renderPortfolio();
  } else {
    portfolioTab.hidden = true;
  }

  async function renderPortfolio() {
    portfolioSection.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = 'Meu Portfólio';
    const intro = document.createElement('p');
    intro.textContent = 'Apresente seus trabalhos com imagens e uma descrição curta.';
    const feedback = document.createElement('p');
    feedback.className = 'portfolio-feedback';
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    portfolioSection.append(heading, intro, feedback);

    let items;
    try { items = await api.request('portfolio'); }
    catch (error) {
      feedback.textContent = error.message || 'Não foi possível carregar seu portfólio.';
      const retry = document.createElement('button');
      retry.type = 'button'; retry.className = 'portfolio-add-button'; retry.textContent = 'Tentar novamente';
      retry.addEventListener('click', renderPortfolio);
      portfolioSection.appendChild(retry);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'portfolio-grid portfolio-grid--manage';
    const add = document.createElement('button');
    add.type = 'button'; add.className = 'portfolio-add-button'; add.textContent = '+ Adicionar trabalho';
    add.addEventListener('click', openPortfolioUpload);
    grid.appendChild(add);

    items.forEach(item => {
      const card = document.createElement('figure');
      card.className = 'portfolio-work';
      const image = document.createElement('img');
      image.src = item.image_url;
      image.alt = item.description || 'Trabalho do portfólio';
      image.loading = 'lazy';
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'portfolio-remove'; remove.textContent = 'Excluir';
      remove.addEventListener('click', async () => {
        if (!confirm('Excluir este trabalho do portfólio?')) return;
        remove.disabled = true;
        try {
          await api.request(`portfolio/${item.id}`, { method: 'DELETE' });
          let cleanupFailed = false;
          if (item.storage_path) {
            try {
              const { error } = await api.supabase.storage.from('avatars').remove([item.storage_path]);
              cleanupFailed = Boolean(error);
            } catch (_) { cleanupFailed = true; }
          }
          await renderPortfolio();
          if (cleanupFailed) {
            const status = portfolioSection.querySelector('.portfolio-feedback');
            status.textContent = 'O trabalho foi excluído, mas a imagem não pôde ser removida do armazenamento.';
          }
        } catch (error) {
          remove.disabled = false;
          feedback.textContent = error.message || 'Não foi possível excluir este trabalho.';
        }
      });
      card.append(image);
      if (item.description) {
        const caption = document.createElement('figcaption');
        caption.textContent = item.description;
        card.appendChild(caption);
      }
      card.appendChild(remove);
      grid.appendChild(card);
    });
    portfolioSection.appendChild(grid);
  }

  const portfolioModal = document.createElement('div');
  portfolioModal.className = 'avatar-modal';
  portfolioModal.id = 'portfolioUploadModal';
  portfolioModal.hidden = true;
  portfolioModal.setAttribute('role', 'dialog');
  portfolioModal.setAttribute('aria-modal', 'true');
  portfolioModal.setAttribute('aria-labelledby', 'portfolioUploadTitle');
  portfolioModal.innerHTML = `<section class="avatar-modal__panel portfolio-upload-panel" aria-describedby="portfolioUploadDescription"><header class="avatar-modal__header"><div><h2 id="portfolioUploadTitle">Adicionar trabalho</h2><p id="portfolioUploadDescription">Escolha uma imagem nítida de até 5 MB.</p></div><button class="avatar-modal__close" id="closePortfolioUpload" type="button" aria-label="Fechar painel">×</button></header><button class="avatar-dropzone portfolio-dropzone" id="portfolioDropzone" type="button" aria-label="Arraste ou selecione uma imagem"><span class="avatar-dropzone__preview" id="portfolioUploadPreview" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg></span><strong>Arraste a imagem para cá</strong><span>ou clique para selecionar no dispositivo</span><small>JPG, PNG, GIF ou WebP · máximo de 5 MB</small></button><input id="portfolioFileInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden><label class="portfolio-description" for="portfolioDescription">Descrição (opcional)<input id="portfolioDescription" type="text" maxlength="160" placeholder="Descreva este trabalho"></label><p class="avatar-upload-message" id="portfolioUploadMessage" role="status" aria-live="polite"></p><footer class="avatar-modal__actions"><button type="button" class="avatar-action avatar-action--secondary" id="cancelPortfolioUpload">Cancelar</button><button type="button" class="avatar-action avatar-action--primary" id="savePortfolioUpload" disabled>Salvar trabalho</button></footer></section>`;
  document.body.appendChild(portfolioModal);
  const portfolioDropzone = portfolioModal.querySelector('.avatar-dropzone');
  const portfolioPanel = portfolioModal.querySelector('.portfolio-upload-panel');
  const portfolioInput = document.getElementById('portfolioFileInput');
  const portfolioPreview = document.getElementById('portfolioUploadPreview');
  const portfolioMessage = document.getElementById('portfolioUploadMessage');
  const portfolioDescription = document.getElementById('portfolioDescription');
  const portfolioSave = document.getElementById('savePortfolioUpload');
  const portfolioCloseButtons = [document.getElementById('closePortfolioUpload'), document.getElementById('cancelPortfolioUpload')];
  const emptyPortfolioPreview = portfolioPreview.innerHTML;
  let selectedPortfolio = null;
  let portfolioPreviewUrl = null;
  let portfolioSaving = false;

  function clearPortfolioSelection() {
    if (portfolioPreviewUrl) URL.revokeObjectURL(portfolioPreviewUrl);
    portfolioPreviewUrl = null;
    selectedPortfolio = null;
    portfolioInput.value = '';
    portfolioPreview.innerHTML = emptyPortfolioPreview;
    portfolioDescription.value = '';
    portfolioMessage.textContent = '';
    portfolioMessage.className = 'avatar-upload-message';
    portfolioSave.disabled = true;
    portfolioDropzone.classList.remove('is-dragging');
  }

  function choosePortfolio(files) {
    const { file, validation } = window.NexlarProfileUpload.selectProfileImage(files);
    clearPortfolioSelection();
    if (!validation.valid) {
      portfolioMessage.textContent = validation.error;
      return;
    }
    selectedPortfolio = file;
    portfolioPreviewUrl = URL.createObjectURL(file);
    const image = document.createElement('img');
    image.src = portfolioPreviewUrl;
    image.alt = `Prévia de ${file.name}`;
    portfolioPreview.replaceChildren(image);
    portfolioMessage.textContent = 'Imagem pronta para salvar.';
    portfolioMessage.classList.add('is-success');
    portfolioSave.disabled = false;
  }

  function openPortfolioUpload() {
    clearPortfolioSelection();
    portfolioModal.hidden = false;
    document.body.classList.add('avatar-modal-open');
    document.getElementById('closePortfolioUpload').focus();
  }

  function closePortfolioUpload() {
    if (portfolioSaving) return;
    portfolioModal.hidden = true;
    document.body.classList.remove('avatar-modal-open');
    clearPortfolioSelection();
    portfolioTab.focus();
  }

  portfolioDropzone.addEventListener('click', () => portfolioInput.click());
  portfolioInput.addEventListener('change', () => choosePortfolio(portfolioInput.files));
  ['dragenter', 'dragover'].forEach(type => portfolioDropzone.addEventListener(type, event => {
    event.preventDefault(); portfolioDropzone.classList.add('is-dragging');
  }));
  ['dragleave', 'dragend'].forEach(type => portfolioDropzone.addEventListener(type, () => portfolioDropzone.classList.remove('is-dragging')));
  portfolioDropzone.addEventListener('drop', event => {
    event.preventDefault(); choosePortfolio(event.dataTransfer.files);
  });
  portfolioCloseButtons.forEach(button => button.addEventListener('click', closePortfolioUpload));
  portfolioModal.addEventListener('click', event => { if (event.target === portfolioModal) closePortfolioUpload(); });
  document.addEventListener('keydown', event => {
    if (portfolioModal.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closePortfolioUpload(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...portfolioPanel.querySelectorAll('button:not(:disabled), input:not([type="file"]):not(:disabled)')];
    const first = controls[0]; const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  portfolioSave.addEventListener('click', async () => {
    if (!selectedPortfolio || portfolioSaving) return;
    portfolioSaving = true;
    portfolioSave.disabled = true;
    portfolioSave.textContent = 'Salvando...';
    portfolioPanel.setAttribute('aria-busy', 'true');
    portfolioMessage.textContent = 'Enviando imagem...';
    portfolioMessage.className = 'avatar-upload-message';
    const bucket = api.supabase.storage.from('avatars');
    let uploaded = null;
    let persisted = false;
    try {
      uploaded = await window.NexlarProfileUpload.uploadImage({
        bucket, userId: session.user.id, file: selectedPortfolio, folder: 'portfolio',
      });
      await api.request('portfolio', {
        method: 'POST',
        body: JSON.stringify({
          image_url: uploaded.publicUrl,
          storage_path: uploaded.path,
          description: portfolioDescription.value.trim(),
        }),
      });
      persisted = true;
      portfolioSaving = false;
      closePortfolioUpload();
      await renderPortfolio();
    } catch (error) {
      if (uploaded && !persisted) {
        try {
          const { error: cleanupError } = await bucket.remove([uploaded.path]);
          if (cleanupError) console.error('[Nexlar] Não foi possível limpar um upload de portfólio incompleto.');
        } catch (_) { console.error('[Nexlar] Não foi possível limpar um upload de portfólio incompleto.'); }
      }
      portfolioMessage.textContent = error.message || 'Não foi possível salvar o trabalho.';
      portfolioMessage.className = 'avatar-upload-message';
      portfolioSave.disabled = false;
    } finally {
      portfolioSaving = false;
      portfolioSave.textContent = 'Salvar trabalho';
      portfolioPanel.removeAttribute('aria-busy');
    }
  });

  tabs.forEach((tab, index) => tab.addEventListener('click', () => {
    tabs.forEach(item => item.classList.remove('active')); tab.classList.add('active');
    const portfolioOpen = index === 1 && portfolioSection;
    form.hidden = Boolean(portfolioOpen);
    profileTitle.hidden = Boolean(portfolioOpen);
    if (portfolioSection) portfolioSection.hidden = !portfolioOpen;
  }));

  form.addEventListener('submit', async event => {
    event.preventDefault(); const button = form.querySelector('.btn-save'); button.disabled = true; button.textContent = 'Salvando...';
    try {
      await api.request('me', { method: 'PATCH', body: JSON.stringify({
        full_name: document.getElementById('profileName').value.trim(), phone: document.getElementById('profilePhone').value.trim(),
        neighborhood: canOffer ? neighborhoodField.value : undefined,
        service_category: canOffer ? serviceField.value : undefined,
        bio: document.getElementById('profileBio').value.trim(),
      }) });
      button.textContent = 'Dados salvos ✓';
    } catch (error) { alert(error.message); button.textContent = 'Salvar alterações'; }
    setTimeout(() => { button.disabled = false; button.textContent = 'Salvar alterações'; }, 1500);
  });

  document.querySelector('.btn-outline').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const { error } = await api.supabase.auth.signOut();
      if (error) throw error;
      location.href = '/';
    } catch (error) {
      button.disabled = false;
      alert(error.message || 'Não foi possível sair da conta. Tente novamente.');
    }
  });
  document.querySelector('.btn-danger').addEventListener('click', () => alert('Para excluir sua conta com segurança, solicite ao suporte Nexlar.'));
});
