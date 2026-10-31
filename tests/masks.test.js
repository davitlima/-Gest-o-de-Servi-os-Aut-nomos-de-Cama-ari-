const assert = require('node:assert/strict');
const masks = require('../src/js/masks.js');

assert.equal(masks.date('31122000'), '31/12/2000');
assert.equal(masks.cpf('12345678900'), '123.456.789-00');
assert.equal(masks.cnpj('12345678000190'), '12.345.678/0001-90');
assert.equal(masks.phone('71999999999'), '(71) 99999-9999');
assert.equal(masks.phone('7133334444'), '(71) 3333-4444');
assert.equal(masks.validDate('31/02/2000'), false);
assert.equal(masks.validDate('29/02/2000'), true);

console.log('Máscaras de cadastro passaram.');
