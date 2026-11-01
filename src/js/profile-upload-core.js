(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NexlarProfileUpload = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const profileImageLimit = 5 * 1024 * 1024;

  function validateProfileImage(file) {
    if (!file || !file.type.startsWith('image/')) return { valid: false, error: 'Selecione um arquivo de imagem.' };
    if (file.size > profileImageLimit) return { valid: false, error: 'A imagem deve ter no máximo 5 MB.' };
    return { valid: true };
  }

  return { profileImageLimit, validateProfileImage };
});
