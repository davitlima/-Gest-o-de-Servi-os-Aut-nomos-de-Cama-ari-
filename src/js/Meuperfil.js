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
  const neighborhoodField = document.getElementById('profileNeighborhood');
  const serviceField = document.getElementById('profileService');
  if (canOffer) {
    const matchingOption = (field, saved) => [...field.options].find(option =>
      window.NexlarMarketplace.normalize(option.value) === window.NexlarMarketplace.normalize(saved));
    const knownNeighborhood = matchingOption(neighborhoodField, me.neighborhood);
    const knownService = matchingOption(serviceField, me.service_category);
    if (me.neighborhood && !knownNeighborhood) neighborhoodField.add(new Option(`Atual: ${me.neighborhood}`, me.neighborhood));
    if (me.service_category && !knownService) serviceField.add(new Option(`Atual: ${me.service_category}`, me.service_category));
    if (me.neighborhood) neighborhoodField.value = knownNeighborhood?.value || me.neighborhood;
    if (me.service_category) serviceField.value = knownService?.value || me.service_category;
  } else {
    neighborhoodField.closest('.form-group').hidden = true;
    serviceField.closest('.form-group').hidden = true;
    neighborhoodField.disabled = true;
    serviceField.disabled = true;
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
    image.alt = `PrÃ©via de ${file.name}`;
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
      avatarMessage.textContent = error.mesï[h‘éì¶»§q«^wF%6fRçFW‡D6öçFVçBÒu6Çf"f÷Fòs°Ð¢fF%æVÂç&VÖ÷fTGG&–'WFR‚v&–Ö'W7’r“°Ð¢ÐÐ¢Ò“°Ð Ð¢ÆWB÷'FföÆ–õ6V7F–öâÒçVÆÃ°Ð¢–b†6äöffW"’°Ð¢÷'FföÆ–õ6V7F–öâÒFö7VÖVçBæ7&VFTVÆVÖVçB‚vF—br“²÷'FföÆ–õ6V7F–öâæ–BÒw÷'FföÆ–òÖ6öçFVçBs²÷'FföÆ–õ6V7F–öâç7G–ÆRæF—7Æ’ÒvæöæRs°Ð¢&öf–ÆT6&BæVæD6†–ÆB‡÷'FföÆ–õ6V7F–öâ“°Ð¢v—B&VæFW%÷'FföÆ–ò‚“°Ð¢ÒVÇ6R°Ð¢÷'FföÆ–õF"æ†–FFVâÒG'VS°Ð¢ÐÐ Ð¢7–æ2gVæ7F–öâ&VæFW%÷'FföÆ–ò‚’°Ð¢6öç7B—FV×2Òv—B’ç&WVW7B‚w÷'FföÆ–òr“°Ð¢÷'FföÆ–õ6V7F–öâæ–ææW$…DÔÂÒsÆƒ3äÖWR÷'Fl;6Æ–óÂöƒ3ãÇäF–6–öæR–ÖvVç2F÷26WW2G&&Æ†÷26öæ6Ç\:ÖF÷2ãÂ÷âs°Ð¢6öç7Bw&–BÒFö7VÖVçBæ7&VFTVÆVÖVçB‚vF—br“²w&–Bç7G–ÆRæ775FW‡BÒvF—7Æ“¦w&–C¶w&–B×FV×ÆFRÖ6öÇVÖç3§&WVB†WFòÖf–ÆÂÆÖ–æÖ‚ƒS‚Ãg"’“¶v£g‚s°Ð¢6öç7BFBÒFö7VÖVçBæ7&VFTVÆVÖVçB‚v'WGFöâr“²FBçG—RÒv'WGFöâs²FBçFW‡D6öçFVçBÒr²F–6–öæ"G&&Æ†òs²FBç7G–ÆRæ775FW‡BÒvÖ–âÖ†V–v‡C£Sƒ¶&÷&FW#£'‚F6†VBf"‚ÒÖ&÷&FW"“¶&6¶w&÷VæC§v†—FS¶&÷&FW"×&F—W3£'ƒ¶7W'6÷#§ö–çFW"s°Ð¢FBæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂ7–æ2‚’Óâ°Ð¢6öç7B–ÖvU÷W&ÂÒ&ö×B‚t6öÆRU$Â;¦&Æ–6Ff÷FòFòG&&Æ†ó¢r“²–b‚–ÖvU÷W&Â’&WGW&ã°Ð¢6öç7BFW67&—F–öâÒ&ö×B‚tFW67&œ:|:6òFòG&&Æ†ò†÷6–öæÂ“¢r’ÇÂrs°Ð¢G'’²v—B’ç&WVW7B‚w÷'FföÆ–òrÂ²ÖWF†öC¢uõ5BrÂ&öG“¢¥4ôâç7G&–æv–g’‡²–ÖvU÷W&ÂÂFW67&—F–öâÒ’Ò“²v—B&VæFW%÷'FföÆ–ò‚“²ÐÐ¢6F6‚†W'&÷"’²ÆW'B†W'&÷"æÖW76vR“²ÐÐ¢Ò“°Ð¢w&–BæVæD6†–ÆB†FB“°Ð¢—FV×2æf÷$V6‚†—FVÒÓâ°Ð¢6öç7B6&BÒFö7VÖVçBæ7&VFTVÆVÖVçB‚vf–wW&Rr“²6&Bç7G–ÆRæ775FW‡BÒvÖ&v–ã£·÷6—F–öã§&VÆF—fS¶&÷&FW"×&F—W3£'ƒ¶÷fW&fÆ÷s¦†–FFVã¶&÷&FW#£‚6öÆ–Bf"‚ÒÖ&÷&FW"’s°Ð¢6öç7B–ÖvRÒFö7VÖVçBæ7&VFTVÆVÖVçB‚v–Örr“²–ÖvRç7&2Ò—FVÒæ–ÖvU÷W&Ã²–ÖvRæÇBÒ—FVÒæFW67&—F–öâÇÂuG&&Æ†òFò÷'Fl;6Æ–òs²–ÖvRç7G–ÆRæ775FW‡BÒwv–GFƒ£S¶†V–v‡C£Sƒ¶ö&¦V7BÖf—C¦6÷fW#¶F—7Æ“¦&Æö6²s°Ð¢6öç7B&VÖ÷fRÒFö7VÖVçBæ7&VFTVÆVÖVçB‚v'WGFöâr“²&VÖ÷fRçG—RÒv'WGFöâs²&VÖ÷fRçFW‡D6öçFVçBÒtW†6ÇV—"s²&VÖ÷fRç7G–ÆRæ775FW‡BÒw÷6—F–öã¦'6öÇWFS·&–v‡C£‡ƒ¶&÷GFöÓ£‡ƒ·FF–æs£g‚‚s°Ð¢&VÖ÷fRæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂ7–æ2‚’Óâ²–b†6öæf—&Ò‚tW†6ÇV—"W7F–ÖvVÓòr’’²v—B’ç&WVW7B†÷'FföÆ–òòG¶—FVÒæ–GÖÂ²ÖWF†öC¢tDTÄUDRrÒ“²v—B&VæFW%÷'FföÆ–ò‚“²ÒÒ“°Ð¢6&BæVæB†–ÖvRÂ&VÖ÷fR“²w&–BæVæD6†–ÆB†6&B“°Ð¢Ò“°Ð¢÷'FföÆ–õ6V7F–öâæVæD6†–ÆB†w&–B“°Ð¢ÐÐ Ð¢F'2æf÷$V6‚‚‡F"Â–æFW‚’ÓâF"æFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂ‚’Óâ°Ð¢F'2æf÷$V6‚†—FVÒÓâ—FVÒæ6Æ74Æ—7Bç&VÖ÷fR‚v7F—fRr’“²F"æ6Æ74Æ—7BæFB‚v7F—fRr“°Ð¢6öç7B÷'FföÆ–ô÷VâÒ–æFW‚ÓÓÒbb÷'FföÆ–õ6V7F–öã°Ð¢f÷&Òç7G–ÆRæF—7Æ’Ò÷'FföÆ–ô÷VâòvæöæRr¢vfÆW‚s²&öf–ÆUF—FÆRç7G–ÆRæF—7Æ’Ò÷'FföÆ–ô÷VâòvæöæRr¢v&Æö6²s°Ð¢–b‡÷'FföÆ–õ6V7F–öâ’÷'FföÆ–õ6V7F–öâç7G–ÆRæF—7Æ’Ò÷'FföÆ–ô÷Vâòv&Æö6²r¢væöæRs°Ð¢Ò’“°Ð Ð¢f÷&ÒæFDWfVçDÆ—7FVæW"‚w7V&Ö—BrÂ7–æ2WfVçBÓâ°Ð¢WfVçBç&WfVçDFVfVÇB‚“²6öç7B'WGFöâÒf÷&ÒçVW'•6VÆV7F÷"‚ræ'Fâ×6fRr“²'WGFöâæF—6&ÆVBÒG'VS²'WGFöâçFW‡D6öçFVçBÒu6ÇfæFòâââs°Ð¢G'’°Ð¢6öç7BWFFW2Ò°Ð¢gVÆÅöæÖS¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚w&öf–ÆTæÖRr’çfÇVRçG&–Ò‚’Â†öæS¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚w&öf–ÆU†öæRr’çfÇVRçG&–Ò‚’ÀÐ¢&–ó¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚w&öf–ÆT&–òr’çfÇVRçG&–Ò‚’ÀÐ¢Ó°Ð¢–b†6äöffW"’ö&¦V7Bæ76–vâ‡WFFW2Â²æV–v†&÷&†ööC¢æV–v†&÷&†ööDf–VÆBçfÇVRÂ6W'f–6Uö6FVv÷'“¢6W'f–6Tf–VÆBçfÇVRÒ“°Ð¢v—B’ç&WVW7B‚vÖRrÂ²ÖWF†öC¢uD4‚rÂ&öG“¢¥4ôâç7G&–æv–g’‡WFFW2’Ò“°Ð¢'WGFöâçFW‡D6öçFVçBÒtFF÷26Çf÷2)É2s°Ð¢Ò6F6‚†W'&÷"’²ÆW'B†W'&÷"æÖW76vR“²'WGFöâçFW‡D6öçFVçBÒu6Çf"ÇFW&:|;VW2s²ÐÐ¢6WEF–ÖV÷WB‚‚’Óâ²'WGFöâæF—6&ÆVBÒfÇ6S²'WGFöâçFW‡D6öçFVçBÒu6Çf"ÇFW&:|;VW2s²ÒÂS“°Ð¢Ò“°Ð Ð¢Fö7VÖVçBçVW'•6VÆV7F÷"‚ræ'FâÖ÷WFÆ–æRr’æFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂ7–æ2WfVçBÓâ°Ð¢6öç7B'WGFöâÒWfVçBæ7W'&VçEF&vWC°Ð¢'WGFöâæF—6&ÆVBÒG'VS°Ð¢G'’°Ð¢6öç7B²W'&÷"ÒÒv—B’ç7W&6RæWF‚ç6–vä÷WB‚“°Ð¢–b†W'&÷"’F‡&÷rW'&÷#°Ð¢Æö6F–öâæ‡&VbÒròs°Ð¢Ò6F6‚†W'&÷"’°Ð¢'WGFöâæF—6&ÆVBÒfÇ6S°Ð¢ÆW'B†W'&÷"æÖW76vRÇÂtì:6òfö’÷7<:×fVÂ6—"F6öçFâFVçFRæ÷fÖVçFRâr“°Ð¢ÐÐ¢Ò“°Ð¢Fö7VÖVçBçVW'•6VÆV7F÷"‚ræ'FâÖFævW"r’æFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂ‚’ÓâÆW'B‚u&W†6ÇV—"7V6öçF6öÒ6VwW&ì:vÂ6öÆ–6—FRò7W÷'FRæW†Æ"âr’“°Ð§Ò“°Ð Ð Ð Ð