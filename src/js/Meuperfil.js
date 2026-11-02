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
  const profilePhoto = document.querySelector('.profile-photo');
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
    heading.textContent = 'Serviços e trabalhos';
    const intro = document.createElement('p');
    intro.textContent = 'Monte ofertas claras para seus clientes: mostre o resultado, explique o que está incluído e informe preço e prazo.';
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
    add.type = 'button'; add.className = 'portfolio-add-button'; add.textContent = '+ Criar oferta de serviço';
    add.addEventListener('click', () => openPortfolioUpload());
    grid.appendChild(add);

    items.forEach(item => {
      const card = document.createElement('figure');
      card.className = 'portfolio-work';
      const image = document.createElement('img');
      image.src = item.image_url;
      image.alt = item.title || item.description || 'Trabalho do portfólio';
      image.loading = 'lazy';
      const body = document.createElement('div'); body.className = 'portfolio-work__body';
      const title = document.createElement('h4'); title.textContent = item.title || 'Trabalho realizado'; body.appendChild(title);
      if (item.description) { const description = document.createElement('p'); description.textContent = item.description; body.appendChild(description); }
      const price = document.createElement('p'); price.className = 'portfolio-work__price';
      if (item.price_mode === 'fixo' && Number(item.price) > 0) price.textContent = `R$ ${Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      else if (item.price_mode === 'a_partir_de' && Number(item.price) > 0) price.textContent = `A partir de R$ ${Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      else price.textContent = 'Preço sob consulta';
      body.appendChild(price);
      if (item.estimated_duration) { const duration = document.createElement('p'); duration.className = 'portfolio-work__duration'; duration.textContent = `Prazo estimado: ${item.estimated_duration}`; body.appendChild(duration); }
      const actions = document.createElement('div'); actions.className = 'portfolio-work__actions';
      const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'portfolio-edit'; edit.textContent = 'Editar'; edit.addEventListener('click', () => openPortfolioUpload(item));
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
      actions.append(edit, remove);
      card.append(image, body, actions);
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
  portfolioModal.innerHTML = `<section class="avatar-modal__panel portfolio-upload-panel" aria-describedby="portfolioUploadDescription"><header class="avatar-modal__header"><div><h2 id="portfolioUploadTitle">Criar oferta de serviço</h2><p id="portfolioUploadDescription">Mostre um trabalho e informe ao cliente o que esperar.</p></div><button class="avatar-modal__close" id="closePortfolioUpload" type="button" aria-label="Fechar painel">×</button></header><button class="avatar-dropzone portfolio-dropzone" id="portfolioDropzone" type="button" aria-label="Arraste ou selecione uma imagem"><span class="avatar-dropzone__preview" id="portfolioUploadPreview" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg></span><strong>Arraste uma foto do trabalho</strong><span>ou clique para selecionar no dispositivo</span><small id="portfolioFileHint">JPG, PNG, GIF ou WebP · máximo de 5 MB</small></button><input id="portfolioFileInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden><div class="portfolio-offer-fields"><label class="portfolio-description" for="portfolioTitle">Nome do serviço<input id="portfolioTitle" type="text" maxlength="90" required placeholder="Ex.: Pintura de quarto"></label><label class="portfolio-description" for="portfolioDescription">Descrição e o que está incluído<textarea id="portfolioDescription" maxlength="1000" rows="3" placeholder="Explique o serviço, materiais, acabamento ou detalhes importantes"></textarea></label><div class="portfolio-offer-fields__row"><label class="portfolio-description" for="portfolioPriceMode">Como informar o preço<select id="portfolioPriceMode"><option value="fixo">Preço fechado</option><option value="a_partir_de">A partir de</option><option value="sob_consulta">Sob consulta</option></select></label><label class="portfolio-description" id="portfolioPriceGroup" for="portfolioPrice">Valor em reais<input id="portfolioPrice" type="number" min="0.01" max="1000000" step="0.01" placeholder="0,00"></label></div><label class="portfolio-description" for="portfolioDuration">Prazo estimado<input id="portfolioDuration" type="text" maxlength="80" placeholder="Ex.: 2 dias úteis"></label></div><p class="avatar-upload-message" id="portfolioUploadMessage" role="status" aria-live="polite"></p><footer class="avatar-modal__actions"><button type="button" class="avatar-action avatar-action--secondary" id="cancelPortfolioUpload">Cancelar</button><button type="button" class="avatar-action avatar-action--primary" id="savePortfolioUpload" disabled>Salvar oferta</button></footer></section>`;
  document.body.appendChild(portfolioModal);
  const portfolioDropzone = portfolioModal.querySelector('.avatar-dropzone');
  const portfolioPanel = portfolioModal.querySelector('.portfolio-upload-panel');
  const portfolioInput = document.getElementById('portfolioFileInput');
  const portfolioPreview = document.getElementById('portfolioUploadPreview');
  const portfolioMessage = document.getElementById('portfolioUploadMessage');
  const portfolioDescription = document.getElementById('portfolioDescription');
  const portfolioTitle = document.getElementById('portfolioTitle');
  const portfolioPriceMode = document.getElementById('portfolioPriceMode');
  const portfolioPrice = document.getElementById('portfolioPrice');
  const portfolioPriceGroup = document.getElementById('portfolioPriceGroup');
  const portfolioDuration = document.getElementById('portfolioDuration');
  const portfolioModalTitle = document.getElementById('portfolioUploadTitle');
  const portfolioFileHint = document.getElementById('portfolioFileHint');
  const portfolioSave = document.getElementById('savePortfolioUpload');
  const portfolioCloseButtons = [document.getElementById('closePortfolioUpload'), document.getElementById('cancelPortfolioUpload')];
  const emptyPortfolioPreview = portfolioPreview.innerHTML;
  let selectedPortfolio = null;
  let portfolioPreviewUrl = null;
  let portfolioSaving = false;
  let portfolioEditingItem = null;

  function clearPortfolioSelection({ keepFields = false } = {}) {
    if (portfolioPreviewUrl) URL.revokeObjectURL(portfolioPreviewUrl);
    portfolioPreviewUrl = null;
    selectedPortfolio = null;
    portfolioInput.value = '';
    portfolioPreview.innerHTML = emptyPortfolioPreview;
    if (!keepFields) {
      portfolioDescription.value = '';
      portfolioTitle.value = '';
      portfolioPriceMode.value = 'fixo';
      portfolioPrice.value = '';
      portfolioDuration.value = '';
      portfolioPriceGroup.hidden = false;
      portfolioPrice.required = true;
    }
    portfolioMessage.textContent = '';
    portfolioMessage.className = 'avatar-upload-message';
    portfolioSave.disabled = true;
    portfolioDropzone.classList.remove('is-dragging');
  }

  function choosePortfolio(files) {
    const { file, validation } = window.NexlarProfileUpload.selectProfileImage(files);
    clearPortfolioSelection({ keepFields: true });
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

  function openPortfolioUpload(item = null) {
    clearPortfolioSelection();
    portfolioEditingItem = item;
    if (item) {
      portfolioModalTitle.textContent = 'Editar oferta de serviço';
      portfolioTitle.value = item.title || '';
      portfolioDescription.value = item.description || '';
      portfolioPriceMode.value = ['fixo', 'a_partir_de', 'sob_consulta'].includes(item.price_mode) ? item.price_mode : 'sob_consulta';
      portfolioPrice.value = item.price ?? '';
      portfolioDuration.value = item.estimated_duration || '';
      portfolioFileHint.textContent = 'A imagem atual será mantida se você não escolher outra.';
      if (item.image_url) {
        const image = document.createElement('img'); image.src = item.image_url; image.alt = 'Imagem atual do trabalho'; portfolioPreview.replaceChildren(image);
      }
      portfolioSave.disabled = false;
      portfolioSave.textContent = 'Salvar alterações';
    } else {
      portfolioModalTitle.textContent = 'Criar oferta de serviço';
      portfolioFileHint.textContent = 'JPG, PNG, GIF ou WebP · máximo de 5 MB';
      portfolioSave.textContent = 'Salvar oferta';
    }
      portfolioPriceGroup.hidden = portfolioPriceMode.value === 'sob_consulta';
      portfolioPrice.required = portfolioPriceMode.value !== 'sob_consulta';
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
  portfolioPriceMode.addEventListener('change', () => {
    const quote = portfolioPriceMode.value === 'sob_consulta';
    portfolioPriceGroup.hidden = quote;
    portfolioPrice.required = !quote;
    if (quote) portfolioPrice.value = '';
    if (selectedPortfolio || portfolioEditingItem) portfolioSave.disabled = false;
  });
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
    if ((!selectedPortfolio && !portfolioEditingItem) || portfolioSaving) return;
    if (!portfolioTitle.value.trim()) { portfolioMessage.textContent = 'Informe um nome para o serviço.'; portfolioTitle.focus(); return; }
    if (portfolioPriceMode.value !== 'sob_consulta' && !(Number(portfolioPrice.value) > 0)) { portfolioMessage.textContent = 'Informe um valor válido ou escolha “Sob consulta”.'; portfolioPrice.focus(); return; }
    portfolioSaving = true;
    portfolioSave.disabled = true;
    portfolioSave.textContent = 'Salvando...';
    portfolioPanel.setAttribute('aria-busy', 'true');
    portfolioMessage.textContent = selectedPortfolio ? 'Enviando imagem e salvando oferta...' : 'Salvando oferta...';
    portfolioMessage.className = 'avatar-upload-message';
    const bucket = api.supabase.storage.from('avatars');
    let uploaded = null;
    let persisted = false;
    try {
      const data = {
        title: portfolioTitle.value.trim(),
        description: portfolioDescription.value.trim(),
        price_mode: portfolioPriceMode.value,
        price: portfolioPriceMode.value === 'sob_consulta' ? null : Number(portfolioPrice.value),
        estimated_duration: portfolioDuration.value.trim(),
      };
      if (selectedPortfolio) {
        uploaded = await window.NexlarProfileUpload.uploadImage({ bucket, userId: session.user.id, file: selectedPortfolio, folder: 'portfolio' });
        data.image_url = uploaded.publicUrl; data.storage_path = uploaded.path;
      }
      await api.request(portfolioEditingItem ? `portfolio/${portfolioEditingItem.id}` : 'portfolio', {
        method: portfolioEditingItem ? 'PATCH' : 'POST', body: JSON.stringify(data),
      });
      persisted = true;
      portfolioSaving = false;
      closePortfolioUpload();
      if (uploaded && portfolioEditingItem?.storage_path) {
        try { await bucket.remove([portfolioEditingItem.storage_path]); }
        catch (_) { console.error('[Nexlar] Não foi possível remover a imagem substituída do portfólio.'); }
      }
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
      portfolioSave.textContent = portfolioEditingItem ? 'Salvar alterações' : 'Salvar oferta';
      portfolioPanel.removeAttribute('aria-busy');
    }
  });

  tabs.forEach((tab, index) => tab.addEventListener('click', () => {
    tabs.forEach(item => item.classList.remove('active')); tab.classList.add('active');
    const portfolioOpen = index === 1 && portfolioSection;
    form.hidden = Boolean(portfolioOpen);
    profilePhoto.hidden = Boolean(portfolioOpen);
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

