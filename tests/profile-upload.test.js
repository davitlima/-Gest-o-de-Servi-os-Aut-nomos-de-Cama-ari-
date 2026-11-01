const assert = require('assert');
const { validateProfileImage, profileImageLimit } = require('../src/js/profile-upload-core.js');

assert.equal(profileImageLimit, 5 * 1024 * 1024);
assert.deepEqual(validateProfileImage({ type: 'image/jpeg', size: 1024 }), { valid: true });
assert.equal(validateProfileImage({ type: 'application/pdf', size: 1024 }).valid, false);
assert.equal(validateProfileImage({ type: 'image/png', size: profileImageLimit + 1 }).valid, false);
console.log('Validações de upload de perfil passaram.');
