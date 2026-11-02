(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NexlarProfileUpload = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const profileImageLimit = 5 * 1024 * 1024;
  const profileImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  function validateProfileImage(file) {
    if (!file || !profileImageTypes.includes(file.type)) return { valid: false, error: 'Selecione uma imagem JPG, PNG, GIF ou WebP.' };
    if (file.size > profileImageLimit) return { valid: false, error: 'A imagem deve ter no máximo 5 MB.' };
    return { valid: true };
  }

  function selectProfileImage(files) {
    const file = files?.[0] || null;
    return { file, validation: validateProfileImage(file) };
  }

  async function uploadProfileAvatar({ bucket, updateProfile, userId, file, timestamp = Date.now() }) {
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    const path = `${userId}/${timestamp}-${safeName || 'avatar'}`;
    const { error: uploadError } = await bucket.upload(path, file, { upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;

    const { data } = bucket.getPublicUrl(path);
    try {
      await updateProfile(data.publicUrl);
    } catch (error) {
      await bucket.remove([path]);
      throw error;
    }
    return { path, publicUrl: data.publicUrl };
  }

  return { profileImageLimit, profileImageTypes, validateProfileImage, selectProfileImage, uploadProfileAvatar };
});
