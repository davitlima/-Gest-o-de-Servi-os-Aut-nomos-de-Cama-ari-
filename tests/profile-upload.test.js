const assert = require('assert');
const { validateProfileImage, selectProfileImage, uploadProfileAvatar, profileImageLimit } = require('../src/js/profile-upload-core.js');

assert.equal(profileImageLimit, 5 * 1024 * 1024);
assert.deepEqual(validateProfileImage({ type: 'image/jpeg', size: 1024 }), { valid: true });
assert.equal(validateProfileImage({ type: 'application/pdf', size: 1024 }).valid, false);
assert.equal(validateProfileImage({ type: 'image/svg+xml', size: 1024 }).valid, false);
assert.equal(validateProfileImage({ type: 'image/png', size: profileImageLimit + 1 }).valid, false);

const firstImage = { name: 'perfil.png', type: 'image/png', size: 2048 };
const secondImage = { name: 'outra.jpg', type: 'image/jpeg', size: 1024 };
assert.deepEqual(selectProfileImage([]), {
  file: null,
  validation: { valid: false, error: 'Selecione uma imagem JPG, PNG, GIF ou WebP.' },
});
assert.deepEqual(selectProfileImage([firstImage, secondImage]), {
  file: firstImage,
  validation: { valid: true },
});
assert.equal(selectProfileImage([{ name: 'arquivo.pdf', type: 'application/pdf', size: 1024 }]).validation.valid, false);
assert.equal(selectProfileImage([{ name: 'grande.webp', type: 'image/webp', size: profileImageLimit + 1 }]).validation.valid, false);

(async () => {
  const storedPaths = new Set();
  const bucket = {
    async upload(path) { storedPaths.add(path); return { error: null }; },
    getPublicUrl(path) { return { data: { publicUrl: `https://cdn.example/${path}` } }; },
    async remove(paths) { paths.forEach(path => storedPaths.delete(path)); return { error: null }; },
  };

  await assert.rejects(
    uploadProfileAvatar({
      bucket,
      userId: 'user-1',
      file: firstImage,
      timestamp: 123,
      updateProfile: async () => { throw new Error('Falha ao atualizar perfil'); },
    }),
    /Falha ao atualizar perfil/
  );
  assert.deepEqual([...storedPaths], [], 'Falha no perfil deve remover o upload recém-criado');
  console.log('Validações de upload de perfil passaram.');
})().catch(error => { console.error(error); process.exitCode = 1; });
