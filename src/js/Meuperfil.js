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
  const profileTab = document.getElementById('profileTab');
  const portfolioTab = document.getElementById('portfolioTab');
  const portfolioSection = document.getElementById('portfolio-content');
  const portfolioGrid = document.getElementById('portfolioGrid');
  const portfolioFeedback = document.getElementById('portfolioFeedback');
  const portfolioAdd = document.getElementById('addPortfolioOffer');

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

  if (canOffer) {
    portfolioAdd.addEventListener('click', () => openPortfolioUpload());
    await renderPortfolio();
  } else {
    portfolioTab.hidden = true;
  }

  async function renderPortfolio() {
    portfolioFeedback.className = 'portfolio-feedback';
    portfolioFeedback.textContent = 'Carregando suas ofertas…';
    portfolioGrid.replaceChildren();
    let items;
    try { items = await api.request('portfolio'); }
    catch (error) {
      portfolioFeedback.textContent = error.message || 'Não foi possível carregar seu portfólio.';
      portfolioFeedback.classList.add('is-error');
      const retry = document.createElement('button');
      retry.type = 'button'; retry.className = 'portfolio-retry'; retry.textContent = 'Tentar novamente';
      retry.addEventListener('click', renderPortfolio);
      portfolioGrid.appendChild(retry);
      return;
    }

    portfolioFeedback.textContent = items.length
      ? `${items.length} ${items.length === 1 ? 'oferta publicada' : 'ofertas publicadas'}.`
      : 'Seu portfólio ainda está vazio. Crie sua primeira oferta para apresentar seu trabalho.';
    portfolioFeedback.classList.toggle('is-empty', items.length === 0);
    items.forEach(item => {
      const card = document.createElement('article');
      card.className = 'portfolio-work';
      const images = portfolioImages(item);
      const gallery = document.createElement('div'); gallery.className = 'portfolio-work__gallery';
      images.forEach((entry, index) => {
        const image = document.createElement('img');
        image.src = entry.image_url;
        image.alt = `${item.title || 'Oferta'} — imagem ${index + 1} de ${images.length}`;
        image.loading = index ? 'lazy' : 'eager';
        gallery.appendChild(image);
      });
      const body = document.createElement('div'); body.className = 'portfolio-work__body';
      const title = document.createElement('h3'); title.textContent = item.title || 'Trabalho realizado'; body.appendChild(title);
      if (item.description) { const description = document.createElement('p'); description.className = 'portfolio-work__description'; description.textContent = item.description; body.appendChild(description); }
      const details = document.createElement('div'); details.className = 'portfolio-work__details';
      const price = document.createElement('p'); price.className = 'portfolio-work__price';
      if (item.price_mode === 'fixo' && Number(item.price) > 0) price.textContent = `R$ ${Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      else if (item.price_mode === 'a_partir_de' && Number(item.price) > 0) price.textContent = `A partir de R$ ${Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      else price.textContent = 'Preço sob consulta';
      details.appendChild(price);
      if (item.estimated_duration) { const duration = document.createElement('p'); duration.className = 'portfolio-work__duration'; duration.textContent = `Prazo estimado: ${item.estimated_duration}`; details.appendChild(duration); }
      body.append(details);
      const actions = document.createElement('div'); actions.className = 'portfolio-work__actions';
      const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'portfolio-edit'; edit.textContent = 'Editar oferta'; edit.addEventListener('click', () => openPortfolioUpload(item));
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'portfolio-remove'; remove.textContent = 'Excluir';
      remove.addEventListener('click', async () => {
        if (!confirm('Excluir esta oferta e suas imagens do portfólio?')) return;
        remove.disabled = true;
        try {
          await api.request(`portfolio/${item.id}`, { method: 'DELETE' });
          const paths = images.map(image => image.storage_path).filter(Boolean);
          let cleanupFailed = false;
          if (paths.length) {
            try { const { error } = await api.supabase.storage.from('avatars').remove(paths); cleanupFailed = Boolean(error); }
            catch (_) { cleanupFailed = true; }
          }
          await renderPortfolio();
          if (cleanupFailed) { portfolioFeedback.textContent = 'A oferta foi excluída, mas algumas imagens não puderam ser removidas do armazenamento.'; portfolioFeedback.classList.add('is-error'); }
        } catch (error) {
          remove.disabled = false;
          portfolioFeedback.textContent = error.message || 'Não foi possível excluir esta oferta.';
          portfolioFeedback.classList.add('is-error');
        }
      });
      actions.append(edit, remove);
      card.append(gallery, body, actions);
      portfolioGrid.appendChild(card);
    });
  }

  function portfolioImages(item) {
    const images = item.images?.length ? item.images : item.portfolio_item_images?.length ? item.portfolio_item_images : [];
    return images.length ? images : item.image_url ? [{ image_url: item.image_url, storage_path: item.storage_path || null }] : [];
  }

  const portfolioModal = document.createElement('div');
  portfolioModal.className = 'avatar-modal';
  portfolioModal.id = 'portfolioUploadModal';
  portfolioModal.hidden = true;
  portfolioModal.setAttribute('role', 'dialog');
  portfolioModal.setAttribute('aria-modal', 'true');
  portfolioModal.setAttribute('aria-labelledby', 'portfolioUploadTitle');
  portfolioModal.innerHTML = `<section class="avatar-modal__panel portfolio-upload-panel" aria-describedby="portfolioUploadDescription"><header class="avatar-modal__header"><div><h2 id="portfolioUploadTitle">Criar oferta de serviço</h2><p id="portfolioUploadDescription">Apresente o serviço e mostre exemplos reais do seu trabalho.</p></div><button class="avatar-modal__close" id="closePortfolioUpload" type="button" aria-label="Fechar painel">×</button></header><div class="portfolio-image-manager"><button class="avatar-dropzone portfolio-dropzone" id="portfolioDropzone" type="button" aria-label="Adicionar imagens ao portfólio"><span class="avatar-dropzone__preview" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2v-4" /></svg></span><strong>Adicione fotos dos seus trabalhos</strong><span>Arraste as imagens ou selecione no dispositivo</span><small id="portfolioFileHint">Até 5 imagens · JPG, PNG, GIF ou WebP · 5 MB cada</small></button><input id="portfolioFileInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden><div class="portfolio-upload-preview" id="portfolioUploadPreview" aria-live="polite"></div></div><div class="portfolio-offer-fields"><label class="portfolio-description" for="portfolioTitle">Título da oferta<input id="portfolioTitle" type="text" maxlength="90" required placeholder="Ex.: Pintura de quarto"></label><label class="portfolio-description" for="portfolioDescription">Descrição e o que está incluído<textarea id="portfolioDescription" maxlength="1000" rows="3" placeholder="Descreva o serviço, materiais, acabamento e o que está incluído"></textarea></label><div class="portfolio-offer-fields__row"><label class="portfolio-description" for="portfolioPriceMode">Como informar o preço<select id="portfolioPriceMode"><option value="fixo">Preço fechado</option><option value="a_partir_de">A partir de</option><option value="sob_consulta">Sob consulta</option></select></label><label class="portfolio-description" id="portfolioPriceGroup" for="portfolioPrice">Valor em reais<input id="portfolioPrice" type="number" min="0.01" max="1000000" step="0.01" placeholder="0,00"></label></div><label class="portfolio-description" for="portfolioDuration">Prazo estimado<input id="portfolioDuration" type="text" maxlength="80" placeholder="Ex.: 2 dias úteis"></label></div><p class="avatar-upload-message" id="portfolioUploadMessage" role="status" aria-live="polite"></p><footer class="avatar-modal__actions"><button type="button" class="avatar-action avatar-action--secondary" id="cancelPortfolioUpload">Cancelar</button><button type="button" class="avatar-action avatar-action--primary" id="savePortfolioUpload" disabled>Salvar oferta</button></footer></section>`;
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
  let selectedPortfolioFiles = [];
  let portfolioExistingImages = [];
  let portfolioOriginalImages = [];
  let portfolioSaving = false;
  let portfolioEditingItem = null;
  let portfolioReturnFocus = portfolioAdd;

  function clearPortfolioSelection() {
    selectedPortfolioFiles.forEach(entry => URL.revokeObjectURL(entry.previewUrl));
    selectedPortfolioFiles = [];
    portfolioExistingImages = [];
    portfolioOriginalImages = [];
    portfolioInput.value = '';
    portfolioPreview.replaceChildren();
    portfolioDescription.value = '';
    portfolioTitle.value = '';
    portfolioPriceMode.value = 'fixo';
    portfolioPrice.value = '';
    portfolioDuration.value = '';
    portfolioPriceGroup.hidden = false;
    portfolioPrice.required = true;
    portfolioMessage.textContent = '';
    portfolioMessage.className = 'avatar-upload-message';
    portfolioSave.disabled = true;
    portfolioDropzone.classList.remove('is-dragging');
  }

  function renderPortfolioPreview() {
    portfolioPreview.replaceChildren();
    [...portfolioExistingImages.map(image => ({ image, previewUrl: image.image_url, existing: true })),
      ...selectedPortfolioFiles.map(entry => ({ image: entry.file, previewUrl: entry.previewUrl, existing: false }))]
      .forEach((entry, index) => {
        const tile = document.createElement('figure'); tile.className = 'portfolio-upload-preview__item';
        const image = document.createElement('img'); image.src = entry.previewUrl;
        image.alt = `Imagem ${index + 1} da oferta`;
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'portfolio-upload-preview__remove';
        remove.textContent = 'Remover'; remove.setAttribute('aria-label', `Remover imagem ${index + 1}`);
        remove.addEventListener('click', () => {
          if (entry.existing) portfolioExistingImages = portfolioExistingImages.filter(item => item !== entry.image);
          else {
            const selected = selectedPortfolioFiles.find(item => item.file === entry.image);
            if (selected) { URL.revokeObjectURL(selected.previewUrl); selectedPortfolioFiles = selectedPortfolioFiles.filter(item => item !== selected); }
          }
          renderPortfolioPreview();
          updatePortfolioSaveState();
        });
        tile.append(image, remove);
        portfolioPreview.appendChild(tile);
      });
    const total = portfolioExistingImages.length + selectedPortfolioFiles.length;
    portfolioFileHint.textContent = `${total} de 5 imagens · JPG, PNG, GIF ou WebP · 5 MB cada`;
  }

  function updatePortfolioSaveState() {
    portfolioSave.disabled = portfolioSaving || (!portfolioExistingImages.length && !selectedPortfolioFiles.length);
  }

  function choosePortfolio(files) {
    const { files: selected, validation } = window.NexlarProfileUpload.selectPortfolioImages(files);
    portfolioInput.value = '';
    if (!validation.valid) { portfolioMessage.textContent = validation.error; return; }
    if (portfolioExistingImages.length + selectedPortfolioFiles.length + selected.length > window.NexlarProfileUpload.portfolioImageCountLimit) {
      portfolioMessage.textContent = 'Cada oferta pode ter no máximo cinco imagens.';
      return;
    }
    selectedPortfolioFiles.push(...selected.map(file => ({ file, previewUrl: URL.createObjectURL(file) })));
    portfolioMessage.textContent = 'As imagens estão prontas para salvar.';
    portfolioMessage.className = 'avatar-upload-message is-success';
    renderPortfolioPreview();
    updatePortfolioSaveState();
  }

  function openPortfolioUpload(item = null) {
    portfolioReturnFocus = document.activeElement;
    clearPortfolioSelection();
    portfolioEditingItem = item;
    if (item) {
      portfolioModalTitle.textContent = 'Editar oferta de serviço';
      portfolioTitle.value = item.title || '';
      portfolioDescription.value = item.description || '';
      portfolioPriceMode.value = ['fixo', 'a_partir_de', 'sob_consulta'].includes(item.price_mode) ? item.price_mode : 'sob_consulta';
      portfolioPrice.value = item.price ?? '';
      portfolioDuration.value = item.estimated_duration || '';
      portfolioOriginalImages = portfolioImages(item);
      portfolioExistingImages = [...portfolioOriginalImages];
      portfolioSave.textContent = 'Salvar alterações';
    } else {
      portfolioModalTitle.textContent = 'Criar oferta de serviço';
      portfolioSave.textContent = 'Salvar oferta';
    }
    portfolioPriceGroup.hidden = portfolioPriceMode.value === 'sob_consulta';
    portfolioPrice.required = portfolioPriceMode.value !== 'sob_consulta';
    renderPortfolioPreview();
    updatePortfolioSaveState();
    portfolioModal.hidden = false;
    document.body.classList.add('avatar-modal-open');
    document.getElementById('closePortfolioUpload').focus();
  }

  function closePortfolioUpload() {
    if (portfolioSaving) return;
    portfolioModal.hidden = true;
    document.body.classList.remove('avatar-modal-open');
    clearPortfolioSelection();
    if (portfolioReturnFocus?.isConnected) portfolioReturnFocus.focus();
  }

  portfolioDropzone.addEventListener('click', () => portfolioInput.click());
  portfolioPriceMode.addEventListener('change', () => {
    const quote = portfolioPriceMode.value === 'sob_consulta';
    portfolioPriceGroup.hidden = quote;
    portfolioPrice.required = !quote;
    if (quote) portfolioPrice.value = '';
    updatePortfolioSaveState();
  });
  portfolioInput.addEventListener('change', () => choosePortfolio(portfolioInput.files));
  ['dragenter', 'dragover'].forEach(type => portfolioDropzone.addEventListener(type, event => {
    event.preventDefault(); portfolioDropzone.classList.add('is-dragging');
  }));
  ['dragleave', 'dragend'].forEach(type => portfolioDropzone.addEventListener(type, () => portfolioDropzone.classList.remove('is-dragging')));
  portfolioDropzone.addEventListener('drop', event => { event.preventDefault(); choosePortfolio(event.dataTransfer.files); });
  portfolioDropzone.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); portfolioInput.click(); }
  });
  portfolioCloseButtons.forEach(button => button.addEventListener('click', closePortfolioUpload));
  portfolioModal.addEventListener('click', event => { if (event.target === portfolioModal) closePortfolioUpload(); });
  document.addEventListener('keydown', event => {
    if (portfolioModal.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closePortfolioUpload(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...portfolioPanel.querySelectorAll('button:not(:disabled), input:not([type="file"]):not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
    const first = controls[0]; const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  portfolioSave.addEventListener('click', async () => {
    if (portfolioSaving || (!portfolioExistingImages.length && !selectedPortfolioFiles.length)) return;
    if (!portfolioTitle.value.trim()) { portfolioMessage.textContent = 'Informe um nome para o serviço.'; portfolioTitle.focus(); return; }
    if (portfolioPriceMode.value !== 'sob_consulta' && !(Number(portfolioPrice.value) > 0)) { portfolioMessage.textContent = 'Informe um valor válido ou escolha “Sob consulta”.'; portfolioPrice.focus(); return; }
    portfolioSaving = true;
    portfolioSave.disabled = true;
    portfolioSave.textContent = 'Salvando...';
    portfolioPanel.setAttribute('aria-busy', 'true');
    portfolioMessage.textContent = selectedPortfolioFiles.length ? 'Enviando imagens e salvando oferta…' : 'Salvando oferta…';
    portfolioMessage.className = 'avatar-upload-message';
    const bucket = api.supabase.storage.from('avatars');
    const uploaded = [];
    let persisted = false;
    try {
      const data = {
        title: portfolioTitle.value.trim(),
        description: portfolioDescription.value.trim(),
        price_mode: portfolioPriceMode.value,
        price: portfolioPriceMode.value === 'sob_consulta' ? null : Number(portfolioPrice.value),
        estimated_duration: portfolioDuration.value.trim(),
      };
      for (const [index, entry] of selectedPortfolioFiles.entries()) {
        uploaded.push(await window.NexlarProfileUpload.uploadImage({
          bucket, userId: session.user.id, file: entry.file, folder: 'portfolio', timestamp: Date.now() + index,
        }));
      }
      data.images = [
        ...portfolioExistingImages.map(image => ({ image_url: image.image_url, storage_path: image.storage_path || null })),
        ...uploaded.map(image => ({ image_url: image.publicUrl, storage_path: image.path })),
      ];
      await api.request(portfolioEditingItem ? `portfolio/${portfolioEditingItem.id}` : 'portfolio', {
        method: portfolioEditingItem ? 'PATCH' : 'POST', body: JSON.stringify(data),
      });
      persisted = true;
      portfolioSaving = false;
      const retainedPaths = new Set(portfolioExistingImages.map(image => image.storage_path).filter(Boolean));
      const removedPaths = portfolioOriginalImages.map(image => image.storage_path).filter(path => path && !retainedPaths.has(path));
      const focusAfterSave = portfolioAdd;
      closePortfolioUpload();
      let cleanupFailed = false;
      if (removedPaths.length) {
        try { const { error } = await bucket.remove(removedPaths); cleanupFailed = Boolean(error); }
        catch (_) { cleanupFailed = true; }
      }
      await renderPortfolio();
      if (focusAfterSave?.isConnected) focusAfterSave.focus();
      if (cleanupFailed) {
        portfolioFeedback.textContent = 'A oferta foi salva, mas algumas imagens removidas ainda estão no armazenamento.';
        portfolioFeedback.classList.add('is-error');
      }
    } catch (error) {
      if (uploaded.length && !persisted) {
        try {
          const { error: cleanupError } = await bucket.remove(uploaded.map(image => image.path));
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

  function activateTab(tab, moveFocus = false) {
    const portfolioOpen = tab === portfolioTab && canOffer;
    tabs.forEach(item => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    profileCard.hidden = portfolioOpen;
    portfolioSection.hidden = !portfolioOpen;
    if (moveFocus) tab.focus();
    if (portfolioOpen) portfolioTab.dataset.visited = 'true';
    else if (profileTab) profileTab.dataset.visited = 'true';
  }

  tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab)));
  document.querySelector('.tabs').addEventListener('keydown', event => {
    const available = [...tabs].filter(tab => !tab.hidden);
    const currentIndex = available.indexOf(document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % available.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + available.length) % available.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = available.length - 1;
    else return;
    event.preventDefault();
    activateTab(available[nextIndex], true);
  });

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

  const accountDeleteDialog = document.getElementById('accountDeleteDialog');
  const openAccountDeletion = document.getElementById('openAccountDeletion');
  const accountDeleteConfirmation = document.getElementById('accountDeleteConfirmation');
  const accountDeleteFeedback = document.getElementById('accountDeleteFeedback');
  const confirmAccountDeletion = document.getElementById('confirmAccountDeletion');
  const cancelAccountDeletion = document.getElementById('cancelAccountDeletion');
  const accountDeletionFeedback = document.getElementById('accountDeletionFeedback');
  let deletingAccount = false;

  openAccountDeletion.addEventListener('click', () => {
    accountDeleteConfirmation.value = '';
    accountDeleteFeedback.textContent = '';
    confirmAccountDeletion.disabled = true;
    accountDeleteDialog.showModal();
    accountDeleteConfirmation.focus();
  });

  accountDeleteConfirmation.addEventListener('input', () => {
    confirmAccountDeletion.disabled = accountDeleteConfirmation.value.trim().toUpperCase() !== 'EXCLUIR' || deletingAccount;
  });

  cancelAccountDeletion.addEventListener('click', () => accountDeleteDialog.close());
  accountDeleteDialog.addEventListener('close', () => openAccountDeletion.focus());

  confirmAccountDeletion.addEventListener('click', async () => {
    if (deletingAccount || accountDeleteConfirmation.value.trim().toUpperCase() !== 'EXCLUIR') return;
    deletingAccount = true;
    confirmAccountDeletion.disabled = true;
    cancelAccountDeletion.disabled = true;
    confirmAccountDeletion.textContent = 'Excluindo…';
    accountDeleteFeedback.textContent = 'Removendo seus dados pessoais e preservando o histórico contratual…';
    accountDeletionFeedback.hidden = true;

    try {
      const storage = api.supabase.storage.from('avatars');
      const { data: rootFiles, error: listError } = await storage.list(session.user.id, { limit: 1000 });
      if (listError) throw listError;
      const paths = (rootFiles || [])
        .filter(file => file.id || file.metadata)
        .map(file => `${session.user.id}/${file.name}`);
      if ((rootFiles || []).some(file => file.name === 'portfolio' && !file.id && !file.metadata)) {
        const { data: portfolioFiles, error: portfolioListError } = await storage.list(`${session.user.id}/portfolio`, { limit: 1000 });
        if (portfolioListError) throw portfolioListError;
        paths.push(...(portfolioFiles || []).filter(file => file.id || file.metadata).map(file => `${session.user.id}/portfolio/${file.name}`));
      }
      if (paths.length) {
        const { error: removeError } = await storage.remove(paths);
        if (removeError) throw removeError;
      }

      await api.request('account', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: accountDeleteConfirmation.value.trim().toUpperCase() }),
      });
      await api.supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      location.replace('/');
    } catch (error) {
      const code = String(error.message || '');
      accountDeleteFeedback.textContent = code || 'Não foi possível excluir a conta. Seus dados de perfil continuam ativos; tente novamente.';
      accountDeletionFeedback.textContent = accountDeleteFeedback.textContent;
      accountDeletionFeedback.hidden = false;
      confirmAccountDeletion.disabled = false;
      cancelAccountDeletion.disabled = false;
    } finally {
      deletingAccount = false;
      confirmAccountDeletion.textContent = 'Excluir permanentemente';
      confirmAccountDeletion.disabled = accountDeleteConfirmation.value.trim().toUpperCase() !== 'EXCLUIR';
    }
  });
});

