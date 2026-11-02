const assert = require('node:assert/strict');
const { normalize, matches } = require('../src/js/marketplace-core.js');

assert.equal(normalize('Gleba A'), 'glebaa');
assert.equal(normalize('GLEBA-A'), normalize('Gleba A'));
assert.equal(normalize('Parque Satélite'), normalize(' parque-satelite '));
assert.equal(normalize('PHOC 1'), normalize('Phoc I'));
assert.equal(normalize('Elétrica'), 'eletrica');

const provider = { name: 'João Silva', service: 'Elétrica', neighborhood: 'Gleba A', bio: 'Instalação e manutenção residencial' };
assert.equal(matches(provider, { search: 'joao', service: '', neighborhood: '' }), true);
assert.equal(matches(provider, { search: 'manutencao', service: '', neighborhood: '' }), true);
assert.equal(matches(provider, { search: '', service: 'eletrica', neighborhood: 'gleba-a' }), true);
assert.equal(matches(provider, { search: '', service: 'Hidráulica', neighborhood: 'gleba-a' }), false);
assert.equal(matches(provider, { search: '', service: '', neighborhood: 'Centro' }), false);
console.log('Marketplace normalization and combined filters passed.');
