const assert = require('node:assert/strict');
const { summarize } = require('../src/js/reviews-core.js');

assert.deepEqual(summarize([]), { average: 5, count: 0, stars: 5 });
assert.deepEqual(summarize([{ rating: 5 }, { rating: 2 }]), { average: 3.5, count: 2, stars: 4 });
assert.deepEqual(summarize([{ rating: '4' }, { rating: 0 }, { rating: 6 }, { rating: 'x' }]), { average: 4, count: 1, stars: 4 });
console.log('Review rating summary passed.');
