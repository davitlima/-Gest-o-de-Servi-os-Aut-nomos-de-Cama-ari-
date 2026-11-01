document.addEventListener('DOMContentLoaded', async () => {
  const api = await window.nexlarReady;
  const session = await api.requireSession();
  const input = document.getElementById('photoInput');
  const preview = document.getElementById('photoPreview');
  const message = document.getElementById('photoMessage');
  const save = document.getElementById('savePhoto');
  let selectedFile = null;

  input.addEventListener('change', () => {
    const file = input.files[0];
    const result = window.NexlarProfileUpload.validateProfileImage(file);
    message.textContent = result.valid ? '' : result.error;
    message.className = result.valid ? 'photo-message' : 'photo-message error';
    save.disabled = !result.valid;
    selectedFile = result.valid ? file : null;
    if (!result.valid) { input.value = ''; return; }
    const image = document.createElement('img'); image.alt = 'Prévia da nova foto'; image.src = URL.createObjectURL(file);
    preview.replaceChildren(image);
  });

  save.addEventListener('click', async () => {
    if (!selectedFile) return;
    save.disabled = true; save.textContent = 'Salvando...';
    try {
      const safeName = selectedFile.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
      const path = `${session.user.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await api.supabase.storage.from('avatars').upload(path, selectedFile, { upsert: false, contentType: selectedFile.type });
      if (uploadError) throw uploadError;
      const { data } = api.supabase.storage.from('avatars').getPublicUrl(path);
      await api.request('me', { method: 'PATCH', body: JSON.stringify({ avatar_url: data.publicUrl }) });
      message.textContent = 'Foto atualizada com sucesso.'; message.className = 'photo-message success';
      setTimeout(() => { location.href = '/src/pages/Meuperfil.html'; }, 700);
    } catch (error) { message.textContent = error.message || 'Não foi possível salvar a foto.'; message.className = 'photo-message error'; save.disabled = false; save.textContent = 'Salvar foto'; }
  });
}).catch(error => { document.getElementById('photoMessage').textContent = error.message; });
