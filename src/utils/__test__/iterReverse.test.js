const test = require('tape');
const iterReverse = require('../iterReverse');

test('utils/iterReverse', t => {
  t.deepEquals(Array.from(iterReverse([1, 2, 3])), [3, 2, 1], 'reverse iter array');
  t.deepEquals(Array.from(iterReverse(new Set([1, 2, 3]))), [3, 2, 1], 'reverse iter Set');
  t.end();
});
